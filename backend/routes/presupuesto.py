# =====================
# RUTAS DE PRESUPUESTO
# =====================
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import get_connection
from auth_utils import verificar_token

router = APIRouter()


# =====================
# MODELO DE DATOS
# =====================
class Presupuesto(BaseModel):
    mes: int
    anio: int
    monto_limite: float
    es_flexible: bool = False


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
# GUARDAR O ACTUALIZAR PRESUPUESTO
# POST /api/presupuesto
# =====================
@router.post("/presupuesto")
def guardar_presupuesto(datos: Presupuesto, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO presupuestos (user_id, mes, anio, monto_limite, es_flexible)
           VALUES (%s, %s, %s, %s, %s)
           ON CONFLICT (user_id, mes, anio) DO UPDATE SET
           monto_limite = %s, es_flexible = %s""",
        (user_id, datos.mes, datos.anio, datos.monto_limite, datos.es_flexible,
         datos.monto_limite, datos.es_flexible)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"mensaje": "Presupuesto guardado correctamente"}


# =====================
# VERIFICAR ALERTA DE PRESUPUESTO
# GET /api/presupuesto/alerta/{mes}/{anio}
# =====================
@router.get("/presupuesto/alerta/{mes}/{anio}")
def verificar_alerta(mes: int, anio: int, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)

    conn = get_connection()
    cursor = conn.cursor()

    # Obtener presupuesto del mes
    cursor.execute(
        "SELECT monto_limite, es_flexible FROM presupuestos WHERE user_id = %s AND mes = %s AND anio = %s",
        (user_id, mes, anio)
    )
    presupuesto = cursor.fetchone()

    if not presupuesto:
        return {"alerta": False, "mensaje": "No hay presupuesto definido"}

    # Sumar total de gastos del mes
    cursor.execute(
        """SELECT COALESCE(SUM(monto), 0) FROM actas
           WHERE user_id = %s AND tipo = 'gasto'
           AND EXTRACT(MONTH FROM fecha) = %s
           AND EXTRACT(YEAR FROM fecha) = %s""",
        (user_id, mes, anio)
    )
    total_gastos = float(cursor.fetchone()[0])
    cursor.close()
    conn.close()

    monto_limite = float(presupuesto[0])
    es_flexible = presupuesto[1]
    porcentaje = (total_gastos / monto_limite) * 100 if monto_limite > 0 else 0

    # Alertar si supera el 80% o el 100%
    if total_gastos >= monto_limite:
        return {
            "alerta": True,
            "tipo": "superado",
            "mensaje": f"Superaste tu presupuesto. Gastaste ${total_gastos:,.0f} de ${monto_limite:,.0f}",
            "porcentaje": round(porcentaje, 1),
            "es_flexible": es_flexible
        }
    elif porcentaje >= 80:
        return {
            "alerta": True,
            "tipo": "advertencia",
            "mensaje": f"Llevas el {porcentaje:.1f}% de tu presupuesto",
            "porcentaje": round(porcentaje, 1),
            "es_flexible": es_flexible
        }
    else:
        return {
            "alerta": False,
            "porcentaje": round(porcentaje, 1),
            "total_gastos": total_gastos,
            "monto_limite": monto_limite
        }