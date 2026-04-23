# =====================
# RUTAS DE AUTENTICACION
# =====================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_connection
from auth_utils import encriptar_contrasena, verificar_contrasena, crear_token

router = APIRouter()


# =====================
# MODELOS DE DATOS
# Lo que el frontend debe enviar al backend
# =====================
class RegistroUsuario(BaseModel):
    nombre: str
    email: EmailStr
    contrasena: str


class LoginUsuario(BaseModel):
    email: EmailStr
    contrasena: str


# =====================
# REGISTRO CON EMAIL
# POST /api/auth/registro
# =====================
@router.post("/registro")
def registro(datos: RegistroUsuario):
    conn = get_connection()
    cursor = conn.cursor()

    # Verificar si el email ya existe en la base de datos
    cursor.execute("SELECT id FROM usuarios WHERE email = %s", (datos.email,))
    usuario_existente = cursor.fetchone()

    if usuario_existente:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    # Encriptar contraseña antes de guardar
    contrasena_encriptada = encriptar_contrasena(datos.contrasena)

    # Guardar usuario en la base de datos
    cursor.execute(
        "INSERT INTO usuarios (nombre, email, contrasena) VALUES (%s, %s, %s) RETURNING id",
        (datos.nombre, datos.email, contrasena_encriptada)
    )

    user_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    # Crear token JWT para que el usuario quede logueado automaticamente
    token = crear_token({"sub": str(user_id), "email": datos.email})

    return {
        "mensaje": "Usuario registrado correctamente",
        "token": token,
        "nombre": datos.nombre
    }


# =====================
# LOGIN CON EMAIL
# POST /api/auth/login
# =====================
@router.post("/login")
def login(datos: LoginUsuario):
    conn = get_connection()
    cursor = conn.cursor()

    # Buscar usuario por email
    cursor.execute(
        "SELECT id, nombre, contrasena FROM usuarios WHERE email = %s",
        (datos.email,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()

    # Verificar si existe y si la contraseña es correcta
    if not usuario or not verificar_contrasena(datos.contrasena, usuario[2]):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    # Crear token JWT
    token = crear_token({"sub": str(usuario[0]), "email": datos.email})

    return {
        "mensaje": "Login exitoso",
        "token": token,
        "nombre": usuario[1]
    }