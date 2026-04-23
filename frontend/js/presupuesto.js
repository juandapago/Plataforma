const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

if (!token) window.location.href = "login.html";

const ahora = new Date();
const mes = ahora.getMonth() + 1;
const anio = ahora.getFullYear();

function formatearMoneda(monto) {
  return "$" + monto.toLocaleString("es-CO");
}

async function cargarEstado() {
  try {
    const respuesta = await fetch(API_URL + "/presupuesto/alerta/" + mes + "/" + anio, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!respuesta.ok) return;
    const datos = await respuesta.json();
    const fill = document.getElementById("progresoFill");
    const texto = document.getElementById("progresoTexto");
    const gasto = document.getElementById("gastoActual");
    if (!datos.alerta && datos.monto_limite) {
      gasto.textContent = formatearMoneda(datos.total_gastos);
      fill.style.width = datos.porcentaje + "%";
      texto.textContent = "Llevas el " + datos.porcentaje + "% (" + formatearMoneda(datos.monto_limite) + ")";
      document.getElementById("monto").value = datos.monto_limite;
    } else if (datos.alerta) {
      gasto.textContent = formatearMoneda(datos.total_gastos || 0);
      fill.style.width = Math.min(datos.porcentaje, 100) + "%";
      texto.textContent = datos.mensaje;
      fill.classList.add(datos.tipo === "superado" ? "superado" : "advertencia");
    } else {
      texto.textContent = "Sin presupuesto definido para este mes";
    }
  } catch (e) { console.error(e); }
}

async function guardarPresupuesto() {
  const monto = document.getElementById("monto").value;
  const esFlexible = document.getElementById("esFlexible").checked;
  const btn = document.getElementById("btnPresupuesto");
  document.getElementById("montoError").classList.remove("visible");
  document.getElementById("monto").classList.remove("error-input");
  if (!monto || parseFloat(monto) <= 0) {
    document.getElementById("monto").classList.add("error-input");
    document.getElementById("montoError").classList.add("visible");
    return;
  }
  btn.disabled = true;
  btn.classList.add("loading");
  try {
    const respuesta = await fetch(API_URL + "/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ mes, anio, monto_limite: parseFloat(monto), es_flexible: esFlexible })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) { alert(datos.detail || "Error"); return; }
    document.getElementById("successBanner").classList.add("visible");
    cargarEstado();
    setTimeout(() => document.getElementById("successBanner").classList.remove("visible"), 2000);
  } catch (e) { alert("No se pudo conectar con el servidor"); }
  finally { btn.disabled = false; btn.classList.remove("loading"); }
}

cargarEstado();