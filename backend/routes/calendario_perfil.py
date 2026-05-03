from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import get_connection
from auth_utils import verificar_token

router = APIRouter()


def obtener_user_id(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    token = authorization.split(" ")[1]
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
    return payload["sub"]


@router.get("/calendario/{mes}/{anio}")
def obtener_calendario(mes: int, anio: int, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT fecha, total_gastos, total_ingresos
           FROM resumen_diario
           WHERE user_id = %s
           AND EXTRACT(MONTH FROM fecha) = %s
           AND EXTRACT(YEAR FROM fecha) = %s
           ORDER BY fecha ASC""",
        (user_id, mes, anio)
    )
    filas = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"fecha": str(f[0]), "total_gastos": float(f[1]), "total_ingresos": float(f[2])} for f in filas]


class ActualizarPerfil(BaseModel):
    nombre: str


@router.get("/perfil")
def obtener_perfil(authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT nombre, email, creado_en FROM usuarios WHERE id = %s",
        (user_id,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"nombre": usuario[0], "email": usuario[1], "creado_en": str(usuario[2])}


@router.put("/perfil")
def actualizar_perfil(datos: ActualizarPerfil, authorization: str = Header(None)):
    user_id = obtener_user_id(authorization)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE usuarios SET nombre = %s WHERE id = %s",
        (datos.nombre, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensaje": "Perfil actualizado correctamente"}