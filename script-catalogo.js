/* =========================================================
   CATÁLOGO COMPLETO - Lógica
   ---------------------------------------------------------
   - Lee los productos de data/catalogo.js (variable CATALOGO),
     generado por actualizar-catalogo.ps1 desde el Excel del proveedor.
   - Filtros: primero la marca, después el género (Todos / Hombre / Mujer / Unisex).
     Al elegir una marca, se desactivan los géneros que esa marca no tiene.
   - Muestra de a 40 productos con el botón "Ver más".
   El catálogo NO tiene precios ni fotos.
   ========================================================= */

(() => {
  const POR_PAGINA = 40;

  // ---------- Referencias al DOM ----------
  const selectMarca = document.getElementById("catalogo-marca");
  const chipsGenero = document.querySelectorAll(".filtros__genero .chip");
  const lista = document.getElementById("catalogo-lista");
  const contador = document.getElementById("catalogo-contador");
  const vacio = document.getElementById("catalogo-vacio");
  const botonVerMas = document.getElementById("catalogo-ver-mas");
  const botonesLimpiar = document.querySelectorAll("[data-limpiar]");

  if (!lista) return;

  const ordenarTexto = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });

  // ---------- Datos ----------
  // Se ordenan por marca (sort estable: dentro de cada marca se respeta el orden del Excel)
  const productos = (typeof CATALOGO !== "undefined" ? CATALOGO : [])
    .slice()
    .sort((a, b) => ordenarTexto(a.marca, b.marca));

  // ---------- Estado de los filtros ----------
  const estado = {
    marca: "",    // "" = todas
    genero: "",   // "" = todos
    mostrados: POR_PAGINA,
  };

  let resultados = [];

  // ---------- Desplegable de marcas (todas, en orden alfabético) ----------
  function cargarMarcas() {
    const marcas = [...new Set(productos.map((p) => p.marca))].sort(ordenarTexto);
    marcas.forEach((m) => selectMarca.add(new Option(m, m)));
  }

  // ---------- Chips de género ----------
  /** Marca el chip activo y desactiva los géneros que la marca elegida no tiene */
  function actualizarGeneros() {
    const generosDisponibles = new Set(
      productos.filter((p) => !estado.marca || p.marca === estado.marca).map((p) => p.genero)
    );

    // Si el género elegido no existe para esta marca, se vuelve a "Todos"
    if (estado.genero && !generosDisponibles.has(estado.genero)) estado.genero = "";

    chipsGenero.forEach((chip) => {
      const genero = chip.dataset.genero;
      const activo = genero === estado.genero;
      chip.classList.toggle("is-active", activo);
      chip.setAttribute("aria-pressed", activo);
      chip.disabled = genero !== "" && !generosDisponibles.has(genero);
    });
  }

  // ---------- Filtrado ----------
  function filtrar() {
    resultados = productos.filter(
      (p) =>
        (!estado.marca || p.marca === estado.marca) &&
        (!estado.genero || p.genero === estado.genero)
    );
  }

  // ---------- Tarjeta ----------
  function crearTarjeta(p) {
    const card = document.createElement("article");
    card.className = "cat-card";

    const nombre = document.createElement("h3");
    nombre.className = "cat-card__nombre";
    nombre.textContent = p.nombre;

    // Marca · Género
    const meta = document.createElement("p");
    meta.className = "cat-card__meta";
    meta.textContent = `${p.marca} · ${p.genero}`;

    const pie = document.createElement("div");
    pie.className = "cat-card__pie";

    // Fragancia (solo si existe)
    if (p.fragancia) {
      const tag = document.createElement("span");
      tag.className = "tag-fragancia";
      tag.textContent = p.fragancia;
      pie.appendChild(tag);
    }

    // Tamaños disponibles
    p.ml.forEach((ml) => {
      const chip = document.createElement("span");
      chip.className = "chip-ml";
      chip.textContent = `${ml} ML`;
      pie.appendChild(chip);
    });

    card.append(nombre, meta);
    if (pie.childElementCount) card.appendChild(pie);
    return card;
  }

  // ---------- Dibujo ----------
  /**
   * @param {boolean} agregar  true = solo agrega la siguiente página ("Ver más")
   */
  function render(agregar = false) {
    const desde = agregar ? lista.childElementCount : 0;
    const hasta = Math.min(estado.mostrados, resultados.length);

    const fragmento = document.createDocumentFragment();
    resultados.slice(desde, hasta).forEach((p) => fragmento.appendChild(crearTarjeta(p)));

    if (agregar) lista.appendChild(fragmento);
    else lista.replaceChildren(fragmento);

    // Contador
    const total = resultados.length;
    contador.textContent = total
      ? `Mostrando ${hasta} de ${total} ${total === 1 ? "perfume" : "perfumes"}`
      : "";

    // Sin resultados / Ver más
    vacio.hidden = total > 0;
    const restantes = total - hasta;
    botonVerMas.hidden = restantes <= 0;
    botonVerMas.textContent = `Ver más (${restantes})`;
  }

  /** Se llama cada vez que cambia un filtro: vuelve a la primera página */
  function aplicarFiltros() {
    actualizarGeneros();
    estado.mostrados = POR_PAGINA;
    filtrar();
    render();
  }

  function limpiarFiltros() {
    estado.marca = "";
    estado.genero = "";
    selectMarca.value = "";
    aplicarFiltros();
  }

  // ---------- Eventos ----------
  selectMarca.addEventListener("change", () => {
    estado.marca = selectMarca.value;
    aplicarFiltros();
  });

  chipsGenero.forEach((chip) =>
    chip.addEventListener("click", () => {
      estado.genero = chip.dataset.genero;
      aplicarFiltros();
    })
  );

  botonVerMas.addEventListener("click", () => {
    estado.mostrados += POR_PAGINA;
    render(true);
  });

  botonesLimpiar.forEach((b) => b.addEventListener("click", limpiarFiltros));

  // ---------- Inicio ----------
  cargarMarcas();
  aplicarFiltros();
})();
