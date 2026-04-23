// =====================
// CONFIGURACION
// =====================

// URL base del backend
const API_URL = "https://plataforma-api-56i2.onrender.com/api";

// Token guardado cuando el usuario hizo login
const token = localStorage.getItem("token");


// =====================
// PROTECCION DE RUTA
// =====================
if (!token) {
  window.location.href = "login.html";
}


// =====================
// VARIABLES GLOBALES
// =====================
let todasLasTransacciones = [];
let filtroActual = "todos";


// =====================
// ICONOS POR CATEGORIA
// =====================
const iconos = {
  // Gastos
  "Comida": "🍔",
  "Transporte": "🚌",
  "Vivienda": "🏠",
  "Salud": "💊",
  "Entretenimiento": "🎮",
  "Ropa": "👕",
  "Educación": "📚",
  "Otra": "📦",
  // Ingresos
  "Salario": "💼",
  "Freelance": "💻",
  "Negocio": "🏪",
  "Inversión": "📈",
  "Regalo": "🎁",
  "Arriendo": "🏠",
  "Bono": "🎯",
  "Otro": "💵"
};


// =====================
// FORMATEAR MONEDA
// =====================
function formatearMoneda(monto) {
  return "$" + monto.toLocaleString("es-CO");
}


// =====================
// FORMATEAR FECHA
// =====================
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr + "T00:00:00");
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


// =====================
// RENDERIZAR LISTA
// =====================
function renderizarLista(transacciones) {
  const lista = document.getElementById("lista");

  if (transacciones.length === 0) {
    lista.innerHTML = `
      <div class="vacio">
        <div class="icono">📭</div>
        <p>No hay transacciones para mostrar</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = transacciones.map(function (t) {
    const icono = iconos[t.categoria] || "💸";
    const signo = t.tipo === "gasto" ? "-" : "+";

    return `
      <div class="transaccion-item">
        <div class="transaccion-icono ${t.tipo}">
          ${icono}
        </div>
        <div class="transaccion-info">
          <p class="categoria">${t.categoria}</p>
          ${t.descripcion ? `<p class="descripcion">${t.descripcion}</p>` : ""}
          <p class="fecha">${formatearFecha(t.fecha)}</p>
        </div>
        <p class="transaccion-monto ${t.tipo}">
          ${signo}${formatearMoneda(t.monto)}
        </p>
      </div>
    `;
  }).join("");
}


// =====================
// FILTRAR TRANSACCIONES
// =====================
function filtrar(tipo) {
  filtroActual = tipo;

  // Actualizar botones
  document.getElementById("filtroTodos").classList.remove("active");
  document.getElementById("filtroGastos").classList.remove("active");
  document.getElementById("filtroIngresos").classList.remove("active");

  if (tipo === "todos") {
    document.getElementById("filtroTodos").classList.add("active");
    renderizarLista(todasLasTransacciones);
  } else if (tipo === "gasto") {
    document.getElementById("filtroGastos").classList.add("active");
    renderizarLista(todasLasTransacciones.filter(function (t) {
      return t.tipo === "gasto";
    }));
  } else {
    document.getElementById("filtroIngresos").classList.add("active");
    renderizarLista(todasLasTransacciones.filter(function (t) {
      return t.tipo === "ingreso";
    }));
  }
}


// =====================
// CARGAR TRANSACCIONES
// =====================
async function cargarTransacciones() {
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
      if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
      }
      return;
    }

    todasLasTransacciones = await respuesta.json();
    renderizarLista(todasLasTransacciones);

  } catch (error) {
    document.getElementById("lista").innerHTML = `
      <div class="vacio">
        <div class="icono">⚠️</div>
        <p>No se pudo cargar el historial</p>
      </div>
    `;
  }
}


// =====================
// INICIAR PAGINA
// =====================
cargarTransacciones();