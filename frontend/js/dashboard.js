// =====================
// CONFIGURACION
// =====================

// URL base del backend
const API_URL = "http://127.0.0.1:8000/api";

// Token guardado cuando el usuario hizo login
const token = localStorage.getItem("token");
const nombre = localStorage.getItem("nombre");


// =====================
// PROTECCION DE RUTA
// Si el usuario no tiene token, lo manda al login
// =====================
if (!token) {
  window.location.href = "login.html";
}


// =====================
// MOSTRAR SALUDO Y FECHA
// =====================
function mostrarEncabezado() {
  // Mostrar nombre del usuario
  document.getElementById("saludo").textContent = "Hola, " + nombre;

  // Mostrar mes y año actual
  const ahora = new Date();
  const opciones = { month: "long", year: "numeric" };
  const fechaTexto = ahora.toLocaleDateString("es-CO", opciones);

  // Poner primera letra en mayuscula
  const fechaCapitalizada = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  document.getElementById("fechaActual").textContent = fechaCapitalizada;
  document.getElementById("balanceMes").textContent = fechaCapitalizada;
}


// =====================
// FORMATEAR MONEDA
// Convierte 1500000 en $1.500.000
// =====================
function formatearMoneda(monto) {
  return "$" + monto.toLocaleString("es-CO");
}


// =====================
// OBTENER RESUMEN DEL MES
// Consulta las transacciones del mes al backend
// =====================
async function obtenerResumen() {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();

  try {
    const respuesta = await fetch(API_URL + "/transacciones/" + mes + "/" + anio, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    if (!respuesta.ok) {
      // Si el token expiró, mandar al login
      if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
      }
      return;
    }

    const transacciones = await respuesta.json();

    // Calcular totales
    let totalIngresos = 0;
    let totalGastos = 0;

    transacciones.forEach(function (t) {
      if (t.tipo === "ingreso") {
        totalIngresos += t.monto;
      } else {
        totalGastos += t.monto;
      }
    });

    const balance = totalIngresos - totalGastos;

    // Mostrar en las tarjetas
    document.getElementById("balance").textContent = formatearMoneda(balance);
    document.getElementById("totalIngresos").textContent = formatearMoneda(totalIngresos);
    document.getElementById("totalGastos").textContent = formatearMoneda(totalGastos);

    // Cambiar color del balance segun si es positivo o negativo
    const balanceEl = document.getElementById("balance");
    if (balance < 0) {
      balanceEl.style.color = "rgba(232, 107, 107, 0.9)";
    }

  } catch (error) {
    console.error("Error al obtener resumen:", error);
  }
}


// =====================
// VERIFICAR ALERTA DE PRESUPUESTO
// =====================
async function verificarAlerta() {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();

  try {
    const respuesta = await fetch(API_URL + "/presupuesto/alerta/" + mes + "/" + anio, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    if (!respuesta.ok) return;

    const datos = await respuesta.json();
    const alerta = document.getElementById("alertaPresupuesto");

    if (datos.alerta) {
      // Mostrar alerta
      alerta.classList.add("visible");
      document.getElementById("alertaMensaje").textContent = datos.mensaje;

      // Cambiar color segun el tipo de alerta
      if (datos.tipo === "superado") {
        document.getElementById("alertaTitulo").textContent = "⚠️ Presupuesto superado";
      } else {
        document.getElementById("alertaTitulo").textContent = "⚡ Advertencia de presupuesto";
        alerta.classList.add("advertencia");
      }
    }

  } catch (error) {
    console.error("Error al verificar alerta:", error);
  }
}


// =====================
// INICIAR DASHBOARD
// Se ejecuta cuando la pagina carga
// =====================
mostrarEncabezado();
obtenerResumen();
verificarAlerta();