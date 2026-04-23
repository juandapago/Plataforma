from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, transacciones, presupuesto, calendario_perfil

app = FastAPI(title="Plataforma API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(transacciones.router, prefix="/api", tags=["Transacciones"])
app.include_router(presupuesto.router, prefix="/api", tags=["Presupuesto"])
app.include_router(calendario_perfil.router, prefix="/api", tags=["Calendario"])

@app.get("/")
def inicio():
    return {"mensaje": "Plataforma API funcionando correctamente"}