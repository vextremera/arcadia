/**
 * Guardado sin recargar la página en el panel.
 *
 * Los 82 formularios del panel hacen POST a `/api/admin/**` y esas rutas
 * responden con una redirección a la misma pantalla con `?saved=…` o
 * `?error=…`. Funciona, pero cada guardado repinta la página entera: parpadeo,
 * el scroll al principio y los desplegables cerrados. Editando un producto con
 * catorce formularios eso cansa.
 *
 * Aquí se intercepta el envío, se hace la misma petición por detrás, se sigue
 * la redirección y se cambia **sólo el contenido de `<main>`** con el HTML que
 * ha devuelto el servidor. La barra lateral, la cabecera y el scroll se quedan
 * donde estaban.
 *
 * No es una idea nueva en este proyecto: es lo que ya hacían a mano las
 * pantallas de menú diario y festivo, sacado a un sitio para que valga en todas
 * sin tocar ni un formulario ni una ruta de la API.
 *
 * Qué NO es: no ahorra trabajo al servidor, que sigue renderizando la página
 * completa. Lo que quita es el repintado del navegador, que es lo que se nota.
 *
 * Y ante cualquier duda se rinde: si algo no cuadra, deja que el navegador
 * navegue como siempre. Vale más un parpadeo que una pantalla a medias.
 */

const MAIN = "[data-admin-main-scroll]";
const HEADING = "[data-admin-page-heading]";

/** Formularios que ya se apañan solos (menú diario y festivo). */
const OPT_OUT = "[data-no-ajax]";

let peticionEnCurso = 0;

function main(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MAIN);
}

/** Guarda lo que el usuario tenía abierto o enfocado, para devolverlo tras el cambio. */
type EstadoVisual = {
  scroll: number;
  desplegados: string[];
  enfocado: string | null;
};

function capturarEstado(raiz: HTMLElement): EstadoVisual {
  return {
    scroll: raiz.scrollTop,
    // Los <details> abiertos se identifican por su id o por su posición.
    desplegados: Array.from(raiz.querySelectorAll("details[open]")).map(
      (el, i) => el.id || `#${i}`,
    ),
    enfocado: document.activeElement instanceof HTMLElement ? document.activeElement.id || null : null,
  };
}

function restaurarEstado(raiz: HTMLElement, estado: EstadoVisual): void {
  const abiertos = new Set(estado.desplegados);
  raiz.querySelectorAll("details").forEach((el, i) => {
    if (abiertos.has(el.id || `#${i}`)) el.setAttribute("open", "");
  });

  raiz.scrollTop = estado.scroll;

  if (estado.enfocado) {
    const destino = raiz.querySelector<HTMLElement>(`#${CSS.escape(estado.enfocado)}`);
    // `preventScroll` porque devolver el foco no debe mover la página otra vez.
    destino?.focus?.({ preventScroll: true });
  }
}

/**
 * Vuelve a ejecutar los `<script>` que venían en el HTML nuevo.
 *
 * Asignar `innerHTML` inserta las etiquetas pero el navegador no las ejecuta,
 * por diseño. Sin esto, pantallas como Tickets o Newsletter perderían su
 * comportamiento en cuanto se guardara algo dentro de ellas.
 */
function reejecutarScripts(raiz: HTMLElement): void {
  raiz.querySelectorAll("script").forEach((viejo) => {
    const nuevo = document.createElement("script");
    for (const attr of Array.from(viejo.attributes)) {
      nuevo.setAttribute(attr.name, attr.value);
    }
    nuevo.textContent = viejo.textContent;
    viejo.replaceWith(nuevo);
  });
}

/**
 * Qué ha pasado y qué contarle al usuario.
 *
 * El resultado se decide por la URL a la que ha redirigido el servidor
 * (`?saved=…` o `?error=…`), que es lo único inequívoco. El texto se saca del
 * aviso que la página pinta arriba, pero sólo del `<section>` que le
 * corresponde: buscar por color a secas cogía la primera insignia verde que
 * hubiera en pantalla — en Equipo salía "Admin total" como si fuera el
 * resultado de guardar.
 */
function leerAviso(raiz: ParentNode, url: URL): { texto: string; error: boolean } | null {
  const error = url.searchParams.has("error");
  const exito = url.searchParams.has("saved") || url.searchParams.get("sent") === "1";

  if (!error && !exito) return null;

  const banner = raiz.querySelector(
    error ? 'section[class*="border-rose-400/20"]' : 'section[class*="border-emerald-400/20"]',
  );

  const texto = banner?.textContent?.trim();

  return {
    texto: texto || (error ? "No se ha podido guardar." : "Guardado."),
    error,
  };
}

/**
 * Aviso flotante.
 *
 * El banner de la página sigue existiendo, pero está arriba del todo: si
 * guardas un formulario que queda a media pantalla, no lo verías sin subir. Y
 * subir sola es justo lo que molestaba de recargar.
 */
function avisar(texto: string, error: boolean): void {
  document.querySelector("[data-admin-toast]")?.remove();

  const toast = document.createElement("div");
  toast.setAttribute("data-admin-toast", "");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.className = [
    "fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-admin border px-4 py-3",
    "text-sm font-semibold shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition-opacity duration-200",
    error
      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  ].join(" ");
  toast.textContent = texto;

  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    window.setTimeout(() => toast.remove(), 250);
  }, error ? 6000 : 2600);
}

function marcarOcupado(raiz: HTMLElement, ocupado: boolean): void {
  raiz.setAttribute("aria-busy", ocupado ? "true" : "false");
  raiz.classList.toggle("opacity-70", ocupado);
  raiz.classList.toggle("pointer-events-none", ocupado);
}

function botonesDe(form: HTMLFormElement): HTMLButtonElement[] {
  return Array.from(form.querySelectorAll<HTMLButtonElement>('button[type="submit"], button:not([type])'));
}

/**
 * Trae una pantalla del panel y la pone en su sitio, sin recargar.
 *
 * La usan los buscadores y el botón "atrás". Devuelve false si no ha podido,
 * para que quien la llame navegue de verdad.
 */
async function traerPantalla(url: string): Promise<boolean> {
  const raiz = main();
  if (!raiz) return false;

  const id = ++peticionEnCurso;
  marcarOcupado(raiz, true);

  try {
    const respuesta = await fetch(url, {
      credentials: "same-origin",
      headers: { "X-Requested-With": "fetch" },
    });

    if (id !== peticionEnCurso) return true;

    const destino = new URL(respuesta.url, location.href);
    if (destino.pathname !== location.pathname) return false;

    const html = await respuesta.text();
    const nuevo = new DOMParser().parseFromString(html, "text/html");
    const nuevoMain = nuevo.querySelector(MAIN);
    if (!nuevoMain) return false;

    raiz.innerHTML = nuevoMain.innerHTML;
    reejecutarScripts(raiz);
    // Un listado filtrado se lee desde arriba: aquí sí conviene subir.
    raiz.scrollTop = 0;

    document.title = nuevo.title || document.title;
    return true;
  } catch {
    return false;
  } finally {
    if (id === peticionEnCurso) {
      const actual = main();
      if (actual) marcarOcupado(actual, false);
    }
  }
}

async function enviar(form: HTMLFormElement, submitter: HTMLElement | null): Promise<void> {
  const raiz = main();
  if (!raiz) {
    form.submit();
    return;
  }

  const accion = form.getAttribute("action") ?? "";
  const id = ++peticionEnCurso;

  const botones = botonesDe(form);
  botones.forEach((b) => (b.disabled = true));

  const estado = capturarEstado(raiz);
  marcarOcupado(raiz, true);

  try {
    // FormData con el submitter incluido: muchos formularios llevan el
    // `intent` en el propio botón que se pulsa.
    const datos =
      submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
        ? new FormData(form, submitter)
        : new FormData(form);

    const respuesta = await fetch(accion, {
      method: "POST",
      body: datos,
      credentials: "same-origin",
      // Que siga la redirección: lo que interesa es el HTML de la pantalla
      // resultante, con sus avisos ya renderizados por el servidor.
      redirect: "follow",
      headers: { "X-Requested-With": "fetch" },
    });

    // Llegó otra petición mientras tanto: esta respuesta ya no vale.
    if (id !== peticionEnCurso) return;

    /**
     * Si el servidor manda a otra pantalla (un borrado que vuelve al listado),
     * se navega de verdad. Cambiar sólo el `<main>` dejaría la barra lateral
     * señalando una sección que ya no es la que se está viendo.
     */
    const destino = new URL(respuesta.url, location.href);
    if (destino.pathname !== location.pathname) {
      location.href = respuesta.url;
      return;
    }

    const html = await respuesta.text();
    const nuevo = new DOMParser().parseFromString(html, "text/html");
    const nuevoMain = nuevo.querySelector(MAIN);

    if (!nuevoMain) {
      location.href = respuesta.url;
      return;
    }

    raiz.innerHTML = nuevoMain.innerHTML;
    reejecutarScripts(raiz);
    restaurarEstado(raiz, estado);

    // El encabezado vive fuera de `<main>` y puede cambiar (al renombrar algo).
    const encabezado = document.querySelector(HEADING);
    const nuevoEncabezado = nuevo.querySelector(HEADING);
    if (encabezado && nuevoEncabezado) encabezado.textContent = nuevoEncabezado.textContent;

    document.title = nuevo.title || document.title;
    history.replaceState(null, "", respuesta.url);
    ultimaUrl = destino.pathname + destino.search;

    const aviso = leerAviso(nuevoMain, destino);
    if (aviso) avisar(aviso.texto, aviso.error);
  } catch {
    // Red caída, respuesta rara, lo que sea: que lo haga el navegador.
    form.submit();
  } finally {
    if (id === peticionEnCurso) {
      const actual = main();
      if (actual) marcarOcupado(actual, false);
      botones.forEach((b) => (b.disabled = false));
    }
  }
}

document.addEventListener("submit", (event) => {
  // Alguien de la propia pantalla ya se ha encargado (menú diario y festivo
  // traen su propia versión). El listener de la página está más abajo en el
  // árbol, así que ya ha corrido cuando esto se ejecuta.
  if (event.defaultPrevented) return;

  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.matches(OPT_OUT)) return;

  const metodo = (form.getAttribute("method") ?? "get").toLowerCase();
  const accion = form.getAttribute("action") ?? "";

  /**
   * Buscadores y filtros.
   *
   * Van por GET y no guardan nada: sólo recargan el listado con otros
   * parámetros. Se tratan aparte porque el historial funciona al revés que en
   * un guardado — escribes "pizza", luego "pasta", y "atrás" tiene que
   * devolverte a "pizza". De ahí `pushState` en vez de `replaceState`.
   */
  if (metodo === "get" && !accion) {
    const params = new URLSearchParams();
    new FormData(form).forEach((valor, clave) => {
      // Los campos vacíos no pintan nada en la URL y sólo la ensucian.
      const texto = String(valor).trim();
      if (texto) params.append(clave, texto);
    });

    const url = `${location.pathname}${params.toString() ? `?${params}` : ""}`;

    event.preventDefault();
    void traerPantalla(url).then((ok) => {
      if (!ok) {
        location.href = url;
        return;
      }
      history.pushState({ adminAjax: true }, "", url);
      ultimaUrl = url;
    });
    return;
  }

  if (metodo !== "post" || !accion.startsWith("/api/admin/")) return;

  // Salir del panel tiene que recargar de verdad: cambia la sesión entera.
  if (accion === "/api/admin/logout") return;

  event.preventDefault();
  void enviar(form, (event as SubmitEvent).submitter);
});

/**
 * El botón "atrás" del navegador.
 *
 * Sin esto, volver atrás tras filtrar cambiaría la URL pero dejaría el listado
 * anterior en pantalla, que es peor que no tener historial.
 */
let ultimaUrl = location.pathname + location.search;

window.addEventListener("popstate", () => {
  const url = location.pathname + location.search;

  // Un salto a un ancla también dispara popstate y no toca nada del listado.
  if (url === ultimaUrl) return;
  ultimaUrl = url;

  void traerPantalla(url).then((ok) => {
    if (!ok) location.reload();
  });
});
