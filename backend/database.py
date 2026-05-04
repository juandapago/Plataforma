# =====================
# CONEXION A POSTGRESQL
# =====================
import psycopg2
import os
from dotenv import load_dotenv

# Carga las variables del archivo .env
load_dotenv()

def get_connection():
    # Usa la URL del .env para conectarse a Supabase
    connection = psycopg2.connect(os.getenv("DATABASE_URL"))
    return connection