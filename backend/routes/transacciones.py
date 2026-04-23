# =====================
# RUTAS DE TRANSACCIONES
# =====================
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import get_connection
from auth_utils import verificar_token
from datetime import date

router = APIRouter()


# =====================
# MODELO DE DATOS
# =====================
class Transaccion(BaseModel):
    tipo: str
    monto: float
    categoria: str
    descripcion: str = None
    fecha: date


# =====================
# OBTENER USER ID DEL TOKEN
# =====================
def obtener_user_id(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")

    token = authorization.split(" ")[1]
    payload = verificar_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    return payload["sub"]


# =====================
# REGISTRAR TRANSACCION
# POST /api/transacciones
# =====================
@router.post("/transacciones")
def registrar_transaccion(datos: Transaccion, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)

    if datos.tipo not in ["gasto", "ingreso"]:
        raise HTTPException(status_code=400, detail="El tipo debe ser gasto o ingreso")

    conn = get_connection()
    cursor = conn.cursor()

    # Guardar transaccion
    cursor.execute(
        """INSERT INTO actas (user_id, tipo, monto, categoria, descripcion, fecha)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (user_id, datos.tipo, datos.monto, datos.categoria, datos.descripcion, datos.fecha)
    )
    transaction_id = cursor.fetchone()[0]

    # Actualizar resumen diario
    cursor.execute(
        """INSERT INTO resumen_diario (user_id, fecha, total_gastos, total_ingresos)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (user_id, fecha) DO UPDATE SET
           total_gastos = resumen_diario.total_gastos + %s,
           total_ingresos = resumen_diario.total_ingresos + %s""",
        (
            user_id, datos.fecha,
            datos.monto if datos.tipo == "gasto" else 0,
            datos.monto if datos.tipo == "ingreso" else 0,
            datos.monto if datos.tipo == "gasto" else 0,
            datos.monto if datos.tipo == "ingreso" else 0
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"mensaje": "Transacción registrada correctamente", "id": str(transaction_id)}


# =====================
# OBTENER TRANSACCIONES DEL MES
# GET /api/transacciones/{mes}/{anio}
# =====================
@router.get("/transacciones/{mes}/{anio}")
def obtener_transacciones(mes: int, anio: int, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """SELECT id, tipo, monto, categoria, descripcion, fecha
           FROM actas
           WHERE user_id = %s
           AND EXTRACT(MONTH FROM fecha) = %s
           AND EXTRACT(YEAR FROM fecha) = %s
           ORDER BY fecha DESC""",
        (user_id, mes, anio)
    )

    filas = cursor.fetchall()
    cursor.close()
    conn.close()

    transacciones = []
    for fila in filas:
        transacciones.append({
            "id": str(fila[0]),
            "tipo": fila[1],
            "monto": float(fila[2]),
            "categoria": fila[3],
            "descripcion": fila[4],
            "fecha": str(fila[5])
        })

    return transacciones