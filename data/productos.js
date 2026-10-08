/* =========================================================
   CATÁLOGO DE PRODUCTOS
   ---------------------------------------------------------
   Para agregar, quitar o modificar perfumes, editá SOLO esta lista.
   No hace falta tocar el HTML ni el script.

   Cada producto tiene:
     - nombre    : texto que se muestra (y por el que se busca)
     - precio    : número sin puntos ni "$"  (ej: 85000 -> "$ 85.000")
                   Si se pone null (o se deja vacío ""), no se muestra precio.
     - categoria : "hombre", "mujer" o "unisex" (secciones del menú)
     - imagen    : ruta a la foto, ej: "img/productos/sauvage.jpg"
                   Si se deja vacía ("") se muestra el placeholder.

   Viene de Excel/CSV: el contenido entre [ ] es JSON puro, así que
   podés pegar acá la salida de cualquier conversor CSV -> JSON
   (columnas: nombre, precio, categoria, imagen).
   Se guarda como .js (y no .json) para que la página funcione
   abriendo index.html con doble clic, sin necesidad de servidor.
   ========================================================= */

const PRODUCTOS = [
  { "nombre": "Carolina Herrera - Bad boy Set",    "precio": null,   "categoria": "hombre", "imagen": "imagenes/bad boy carolina herrera.jpg" },
  { "nombre": "Bensimon - Bold insignia + bolso de regalo", "precio": null, "categoria": "hombre", "imagen": "imagenes/BI.png" },
  { "nombre": "Bensimon - Bold intense + bolso de regalo", "precio": null, "categoria": "hombre", "imagen": "imagenes/bensimon.jpg" },
  { "nombre": "Azzaro Wanted Intense Set",         "precio": null,   "categoria": "hombre", "imagen": "imagenes/azaro.jpg" },
  { "nombre": "Antonio Banderas Blue Seduction",   "precio": null,   "categoria": "hombre", "imagen": "imagenes/antonio.jpg" },
  { "nombre": "Antonio Banderas - The Icon EDT",   "precio": null,   "categoria": "hombre", "imagen": "imagenes/icon.png" },
  { "nombre": "Antonio Banderas - Seduction X",    "precio": null,   "categoria": "hombre", "imagen": "imagenes/x.jpg" },
  { "nombre": "Carolina Herrera - Blush Elixir Set",      "precio": null, "categoria": "mujer", "imagen": "imagenes/caro.jpg" },
  { "nombre": "Moschino - Toy 2 Set",                     "precio": null, "categoria": "mujer", "imagen": "imagenes/moschi.jpg" },
  { "nombre": "Cher - Dieciocho",                         "precio": null, "categoria": "mujer", "imagen": "imagenes/cher0.jpg" },
  { "nombre": "Cher - Dieciocho Glossy Set",              "precio": null, "categoria": "mujer", "imagen": "imagenes/cher2.jpg" },
  { "nombre": "Cher - Dieciocho Rocket Set",              "precio": null, "categoria": "mujer", "imagen": "imagenes/cher1.jpg" },
  { "nombre": "Tucci - Anime Set",                        "precio": null, "categoria": "mujer", "imagen": "imagenes/tucci.jpg" },
  { "nombre": "Benetton Sisterland - Golden Vainilla",    "precio": null, "categoria": "mujer", "imagen": "imagenes/vaini.jpg" },
  { "nombre": "Odyssey Mandarin Sky",              "precio": null,   "categoria": "hombre", "imagen": "imagenes/mandarin.jpg" }
];
