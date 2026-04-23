// =====================
// CONFIGURACION
// =====================

// URL base del backend
const API_URL = "http://127.0.0.1:8000/api";


// =====================
// UTILIDADES GENERALES
// =====================

// Limpia los errores de los campos antes de una nueva validacion
function limpiarErrores(campos) {
  campos.forEach(function (id) {
    document.getElementById(id).classList.remove("error-input");
    document.getElementById(id + "Error").classList.remove("visible");
  });
}

// Activa o desactiva el estado de carga del boton
function setLoading(btnId, estado) {
  const btn = document.getElementById(btnId);
  btn.disabled = estado;
  if (estado) {
    btn.classList.add("loading");
  } else {
    btn.classList.remove("loading");
  }
}

// Muestra el banner de exito
function mostrarExito() {
  const banner = document.getElementById("successBanner");
  banner.classList.add("visible");
}

// Muestra un error del servidor
function mostrarErrorServidor(mensaje) {
  const banner = document.getElementById("successBanner");
  banner.textContent = mensaje;
  banner.style.background = "rgba(232, 107, 107, 0.1)";
  banner.style.borderColor = "rgba(232, 107, 107, 0.3)";
  banner.style.color = "var(--error)";
  banner.classList.add("visible");
}


// =====================
// LOGIN
// =====================
async function iniciarSesion() {

  // Leer lo que el usuario escribio
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;

  // Limpiar errores anteriores
  limpiarErrores(["correo", "contrasena"]);

  // Validaciones del lado del cliente
  let hayError = false;
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correo || !regexCorreo.test(correo)) {
    document.getElementById("correo").classList.add("error-input");
    document.getElementById("correoError").classList.add("visible");
    hayError = true;
  }

  if (contrasena.length < 6) {
    document.getElementById("contrasena").classList.add("error-input");
    document.getElementById("contrasenaError").classList.add("visible");
    hayError = true;
  }

  if (hayError) return;

  // Activar animacion de carga
  setLoading("btnIngresar", true);

  try {
    // Llamada al backend
    const respuesta = await fetch(API_URL + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: correo, contrasena: contrasena })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarErrorServidor(datos.detail || "Error al iniciar sesión");
      return;
    }

    // Guardar token y nombre en localStorage
    localStorage.setItem("token", datos.token);
    localStorage.setItem("nombre", datos.nombre);

    // Mostrar exito y redirigir al dashboard
    mostrarExito();
    setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (error) {
    mostrarErrorServidor("No se pudo conectar con el servidor");
  } finally {
    setLoading("btnIngresar", false);
  }
}


// =====================
// REGISTRO
// =====================
async function crearCuenta() {

  // Leer lo que el usuario escribio
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const confirmar = document.getElementById("confirmar").value;

  // Limpiar errores anteriores
  limpiarErrores(["nombre", "correo", "contrasena", "confirmar"]);

  // Validaciones del lado del cliente
  let hayError = false;
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (nombre.length < 2) {
    document.getElementById("nombre").classList.add("error-input");
    document.getElementById("nombreError").classList.add("visible");
    hayError = true;
  }

  if (!correo || !regexCorreo.test(correo)) {
    document.getElementById("correo").classList.add("error-input");
    document.getElementById("correoError").classList.add("visible");
    hayError = true;
  }

  if (contrasena.length < 6) {
    document.getElementById("contrasena").classList.add("error-input");
    document.getElementById("contrasenaError").classList.add("visible");
    hayError = true;
  }

  if (contrasena !== confirmar) {
    document.getElementById("confirmar").classList.add("error-input");
    document.getElementById("confirmarError").classList.add("visible");
    hayError = true;
  }

  if (hayError) return;

  // Activar animacion de carga
  setLoading("btnRegistrar", true);

  try {
    // Llamada al backend
    const respuesta = await fetch(API_URL + "/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre, email: correo, contrasena: contrasena })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarErrorServidor(datos.detail || "Error al crear la cuenta");
      return;
    }

    // Guardar token y nombre en localStorage
    localStorage.setItem("token", datos.token);
    localStorage.setItem("nombre", datos.nombre);

    // Mostrar exito y redirigir al login
    mostrarExito();
    setTimeout(function () {
      window.location.href = "login.html";
    }, 2000);

  } catch (error) {
    mostrarErrorServidor("No se pudo conectar con el servidor");
  } finally {
    setLoading("btnRegistrar", false);
  }
}


// =====================
// BARRA DE FORTALEZA DE CONTRASENA
// =====================
function verificarFortaleza() {

  const contrasena = document.getElementById("contrasena").value;

  const barras = [
    document.getElementById("b1"),
    document.getElementById("b2"),
    document.getElementById("b3"),
    document.getElementById("b4"),
  ];

  const label = document.getElementById("strengthLabel");

  let puntaje = 0;
  if (contrasena.length >= 6) puntaje++;
  if (contrasena.length >= 10) puntaje++;
  if (/[A-Z]/.test(contrasena) && /[0-9]/.test(contrasena)) puntaje++;
  if (/[^A-Za-z0-9]/.test(contrasena)) puntaje++;

  const colores = ["#e86b6b", "#e8a96b", "#c8a96e", "#6dc88a"];
  const textos = ["Muy débil", "Débil", "Buena", "Muy fuerte"];

  barras.forEach(function (barra, i) {
    barra.style.background = i < puntaje ? colores[puntaje - 1] : "var(--border)";
  });

  if (contrasena.length > 0) {
    label.textContent = textos[puntaje - 1] || "";
    label.style.color = colores[puntaje - 1];
  } else {
    label.textContent = "";
  }
}


// =====================
// ENVIAR FORMULARIO CON TECLA ENTER
// =====================
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  if (document.getElementById("btnIngresar")) iniciarSesion();
  if (document.getElementById("btnRegistrar")) crearCuenta();
});