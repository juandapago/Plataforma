// =====================
// CONFIGURACION
// =====================

// URL base del backend
const API_URL = "https://plataforma-api-56i2.onrender.com/api";

// Token guardado cuando el usuario hizo login
const token = localStorage.getItem("token");


// =====================
// PROTECCION DE RUTA
// Si el usuario no tiene token, lo manda al login
// =====================
if (!token) {
  window.location.href = "login.html";
}


// =====================
// FUENTE SELECCIONADA
// =====================
let fuenteSeleccionada = null;

function seleccionarFuente(btn, fuente) {
  // Quitar seleccion anterior
  document.querySelectorAll(".fuente-btn").forEach(function (b) {
    b.classList.remove("selected");
  });

  // Seleccionar la nueva
  btn.classList.add("selected");
  fuenteSeleccionada = fuente;
}


// =====================
// PONER FECHA DE HOY POR DEFECTO
// =====================
function ponerFechaHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  document.getElementById("fecha").value = anio + "-" + mes + "-" + dia;
}


// =====================
// REGISTRAR INGRESO
// =====================
async function registrarIngreso() {
  const monto = document.getElementById("monto").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const fecha = document.getElementById("fecha").value;
  const btn = document.getElementById("btnIngreso");

  // Limpiar errores anteriores
  document.getElementById("montoError").classList.remove("visible");
  document.getElementById("fechaError").classList.remove("visible");
  document.getElementById("monto").classList.remove("error-input");

  // Validaciones
  let hayError = false;

  if (!fuenteSeleccionada) {
    alert("Por favor selecciona una fuente de ingreso");
    return;
  }

  if (!monto || parseFloat(monto) <= 0) {
    document.getElementById("monto").classList.add("error-input");
    document.getElementById("montoError").classList.add("visible");
    hayError = true;
  }

  if (!fecha) {
    document.getElementById("fechaError").classList.add("visible");
    hayError = true;
  }

  if (hayError) return;

  // Activar animacion de carga
  btn.disabled = true;
  btn.classList.add("loading");

  try {
    // Llamada al backend
    const respuesta = await fetch(API_URL + "/transacciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        tipo: "ingreso",
        monto: parseFloat(monto),
        categoria: fuenteSeleccionada,
        descripcion: descripcion,
        fecha: fecha
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
      }
      alert(datos.detail || "Error al registrar el ingreso");
      return;
    }

    // Mostrar exito y limpiar formulario
    document.getElementById("successBanner").classList.add("visible");
    document.getElementById("monto").value = "";
    document.getElementById("descripcion").value = "";
    ponerFechaHoy();

    // Quitar fuente seleccionada
    document.querySelectorAll(".fuente-btn").forEach(function (b) {
      b.classList.remove("selected");
    });
    fuenteSeleccionada = null;

    // Ocultar banner despues de 2 segundos
    setTimeout(function () {
      document.getElementById("successBanner").classList.remove("visible");
    }, 2000);

  } catch (error) {
    alert("No se pudo conectar con el servidor");
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
}


// =====================
// INICIAR PAGINA
// =====================
ponerFechaHoy();