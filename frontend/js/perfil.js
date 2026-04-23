// =====================
// CONFIGURACION
// =====================

const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");


// =====================
// PROTECCION DE RUTA
// =====================
if (!token) {
  window.location.href = "login.html";
}


// =====================
// OBTENER INICIALES DEL NOMBRE
// Convierte "Juan Patino" en "JP"
// =====================
function obtenerIniciales(nombre) {
  const palabras = nombre.trim().split(" ");
  if (palabras.length === 1) {
    return palabras[0].charAt(0).toUpperCase();
  }
  return (palabras[0].charAt(0) + palabras[palabras.length - 1].charAt(0)).toUpperCase();
}


// =====================
// CARGAR DATOS DEL PERFIL
// =====================
async function cargarPerfil() {
  try {
    const respuesta = await fetch(API_URL + "/perfil", {
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

    const datos = await respuesta.json();

    // Llenar los campos con los datos del usuario
    document.getElementById("nombre").value = datos.nombre;
    document.getElementById("email").value = datos.email;
    document.getElementById("avatarNombre").textContent = datos.nombre;
    document.getElementById("avatarEmail").textContent = datos.email;
    document.getElementById("avatar").textContent = obtenerIniciales(datos.nombre);

    // Actualizar nombre en localStorage
    localStorage.setItem("nombre", datos.nombre);

  } catch (error) {
    console.error("Error al cargar perfil:", error);
  }
}


// =====================
// ACTUALIZAR PERFIL
// =====================
async function actualizarPerfil() {
  const nombre = document.getElementById("nombre").value.trim();
  const btn = document.getElementById("btnGuardar");

  // Limpiar errores
  document.getElementById("nombreError").classList.remove("visible");
  document.getElementById("nombre").classList.remove("error-input");

  // Validacion
  if (nombre.length < 2) {
    document.getElementById("nombre").classList.add("error-input");
    document.getElementById("nombreError").classList.add("visible");
    return;
  }

  // Activar animacion de carga
  btn.disabled = true;
  btn.classList.add("loading");

  try {
    const respuesta = await fetch(API_URL + "/perfil", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ nombre: nombre })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = "login.html";
      }
      alert(datos.detail || "Error al actualizar el perfil");
      return;
    }

    // Actualizar datos en pantalla
    document.getElementById("avatarNombre").textContent = nombre;
    document.getElementById("avatar").textContent = obtenerIniciales(nombre);
    localStorage.setItem("nombre", nombre);

    // Mostrar exito
    document.getElementById("successBanner").classList.add("visible");
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
// CERRAR SESION
// =====================
function cerrarSesion() {
  // Borrar todo del localStorage
  localStorage.clear();
  // Redirigir al login
  window.location.href = "login.html";
}


// =====================
// INICIAR PAGINA
// =====================
cargarPerfil();