/* =========================================================
   PERFUMES IMPORTADOS - Lógica del catálogo
   ---------------------------------------------------------
   - Lee los productos desde data/productos.js (variable PRODUCTOS)
   - Genera las tarjetas dinámicamente
   - Filtra por categoría con las secciones del header (Hombres / Mujeres)
   ========================================================= */

// ---------- WhatsApp ----------
// Número con código de país y área, SOLO dígitos (sin +, espacios ni guiones).
// Ejemplo Argentina: 54 9 11 1234-5678 -> "5491112345678"
const WHATSAPP_NUMERO = "5492215484257";
// Mensaje que aparece ya escrito al abrir el chat
const WHATSAPP_MENSAJE = "Hola! Quería hacer una consulta sobre los perfumes.";

// Imagen que se usa cuando un producto no tiene foto (o la foto no carga)
const IMAGEN_PLACEHOLDER = "img/placeholder.svg";

// Referencias al DOM
const grilla = document.getElementById("product-grid");
const sinResultados = document.getElementById("no-results");
// Solo los botones con categoría (el link "Catálogo" no filtra)
const botonesCategoria = document.querySelectorAll(".nav__link[data-categoria]");

// Categoría elegida en el header
let categoriaActiva = "";   // "" = todas

/**
 * Formatea un número como precio: 45000 -> "$ 45.000"
 */
function formatearPrecio(valor) {
  const numero = Number(valor) || 0;
  return "$ " + numero.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

/**
 * Normaliza texto para buscar sin importar mayúsculas ni tildes.
 * "Chanél" -> "chanel"
 */
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Crea el elemento HTML de una tarjeta de producto.
 */
function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "card";
  // Guardamos la categoría normalizada para filtrar rápido
  tarjeta.dataset.categoria = normalizar(producto.categoria || "");

  // --- Imagen ---
  const media = document.createElement("div");
  media.className = "card__media";

  const img = document.createElement("img");
  img.className = "card__img";
  img.src = producto.imagen || IMAGEN_PLACEHOLDER;
  img.alt = producto.nombre;
  img.loading = "lazy";
  // Si la foto no existe o falla, mostramos el placeholder
  img.onerror = () => {
    img.onerror = null;
    img.src = IMAGEN_PLACEHOLDER;
  };
  media.appendChild(img);

  // --- Nombre y precio ---
  const info = document.createElement("div");
  info.className = "card__info";

  const nombre = document.createElement("h2");
  nombre.className = "card__name";
  nombre.textContent = producto.nombre;

  info.appendChild(nombre);

  // El precio es opcional: si viene vacío o null, no se muestra
  if (producto.precio !== null && producto.precio !== undefined && producto.precio !== "") {
    const precio = document.createElement("p");
    precio.className = "card__price";
    precio.textContent = formatearPrecio(producto.precio);
    info.appendChild(precio);
  }

  tarjeta.append(media, info);
  return tarjeta;
}

/**
 * Dibuja todas las tarjetas en la grilla.
 */
function renderizarProductos(productos) {
  const fragmento = document.createDocumentFragment();
  productos.forEach((p) => fragmento.appendChild(crearTarjeta(p)));
  grilla.replaceChildren(fragmento);
}

/**
 * Muestra solo las tarjetas de la categoría activa.
 */
function filtrarProductos() {
  let visibles = 0;

  grilla.querySelectorAll(".card").forEach((tarjeta) => {
    const coincide = !categoriaActiva || tarjeta.dataset.categoria === categoriaActiva;
    tarjeta.hidden = !coincide;
    if (coincide) visibles++;
  });

  sinResultados.hidden = visibles > 0;
}

/* ---------- Inicio ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // Link del botón de WhatsApp: abre el chat con el mensaje ya escrito
  const botonWhatsapp = document.getElementById("whatsapp-btn");
  if (botonWhatsapp) {
    botonWhatsapp.href =
      `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`;
  }

  // PRODUCTOS viene de data/productos.js
  const productos = typeof PRODUCTOS !== "undefined" ? PRODUCTOS : [];

  renderizarProductos(productos);
  sinResultados.hidden = productos.length > 0;

  // Secciones: un clic activa la categoría, otro clic la desactiva (muestra todo)
  botonesCategoria.forEach((boton) => {
    boton.addEventListener("click", () => {
      const categoria = boton.dataset.categoria;
      categoriaActiva = categoriaActiva === categoria ? "" : categoria;

      botonesCategoria.forEach((b) =>
        b.classList.toggle("is-active", b.dataset.categoria === categoriaActiva)
      );
      filtrarProductos();
      // Si se estaba mirando el catálogo, volver arriba para ver el resultado
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
});
