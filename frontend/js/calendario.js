// =====================
// CONFIGURACION
// =====================

const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}


// =====================
// VARIABLES GLOBALES
// =====================
let mesActual = new Date().getMonth() + 1;
let anioActual = new Date().getFullYear();
let resumenDias = {};


// =====================
// FORMATEAR MONEDA
// =====================
function formatearMoneda(monto) {
  return "$" + monto.toLocaleString("es-CO");
}


// =====================
// CAMBIAR MES
// =====================
function cambiarMes(direccion) {
  mesActual += direccion;

  if (mesActual > 12) {
    mesActual = 1;
    anioActual++;
  } else if (mesActual < 1) {
    mesActual = 12;
    anioActual--;
  }

  cargarCalendario();
}


// =====================
// OBTENER NOMBRE DEL MES
// =====================
function nombreMes(mes, anio) {
  const fecha = new Date(anio, mes - 1, 1);
  const nombre = fecha.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}


// =====================
// SELECCIONAR DIA
// =====================
function seleccionarDia(dia) {
  // Quitar seleccion anterior
  document.querySelectorAll(".dia-cell").forEach(function (c) {
    c.classList.remove("seleccionado");
  });

  // Seleccionar el dia clickeado
  const celda = document.getElementById("dia-" + dia);
  if (celda) celda.classList.add("seleccionado");

  // Mostrar detalle del dia
  const fechaStr = anioActual + "-" + String(mesActual).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
  const datos = resumenDias[fechaStr] || { total_gastos: 0, total_ingresos: 0 };

  const fecha = new Date(fechaStr + "T00:00:00");
  const fechaFormateada = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  document.getElementById("detalleTitulo").textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  document.getElementById("detalleGastos").textContent = formatearMoneda(datos.total_gastos);
  document.getElementById("detalleIngresos").textContent = formatearMoneda(datos.total_ingresos);
  document.getElementById("detalleDia").classList.add("visible");
}


// =====================
// RENDERIZAR CALENDARIO
// =====================
function renderizarCalendario() {
  const grid = document.getElementById("calendarioGrid");
  const hoy = new Date();

  // Primer dia del mes (0=domingo, 1=lunes, etc.)
  const primerDia = new Date(anioActual, mesActual - 1, 1).getDay();

  // Total de dias del mes
  const diasEnMes = new Date(anioActual, mesActual, 0).getDate();

  let html = "";

  // Celdas vacias antes del primer dia
  for (let i = 0; i < primerDia; i++) {
    html += '<div class="dia-cell vacio"></div>';
  }

  // Dias del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaStr = anioActual + "-" + String(mesActual).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
    const datos = resumenDias[fechaStr];

    const esHoy = (
      dia === hoy.getDate() &&
      mesActual === hoy.getMonth() + 1 &&
      anioActual === hoy.getFullYear()
    );

    let clases = "dia-cell";
    if (esHoy) clases += " hoy";

    let indicador = "";
    if (datos) {
      if (datos.total_gastos > 0 && datos.total_ingresos > 0) {
        clases += " tiene-ambos";
      } else if (datos.total_gastos > 0) {
        clases += " tiene-gasto";
      } else if (datos.total_ingresos > 0) {
        clases += " tiene-ingreso";
      }
      indicador = '<div class="indicador"></div>';
    }

    html += `
      <div class="${clases}" id="dia-${dia}" onclick="seleccionarDia(${dia})">
        <span class="dia-numero">${dia}</span>
        ${indicador}
      </div>
    `;
  }

  grid.innerHTML = html;
}


// =====================
// CARGAR CALENDARIO
// =====================
async function cargarCalendario() {
  // Actualizar titulo
  document.getElementById("mesAnio").textContent = nombreMes(mesActual, anioActual);

  // Ocultar detalle
  document.getElementById("detalleDia").classList.remove("visible");

  try {
    const respuesta = await fetch(API_URL + "/calendario/" + mesActual + "/" + anioActual, {
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
      renderizarCalendario();
      return;
    }

    const datos = await respuesta.json();

    // Convertir array a objeto por fecha para acceso rapido
    resumenDias = {};
    datos.forEach(function (d) {
      resumenDias[d.fecha] = d;
    });

    renderizarCalendario();

  } catch (error) {
    console.error("Error al cargar calendario:", error);
    renderizarCalendario();
  }
}


// =====================
// INICIAR PAGINA
// =====================
cargarCalendario();