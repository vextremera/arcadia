/**
 * Consentimiento de cookies de terceros.
 *
 * Sólo hay dos cosas que lo necesiten en toda la web: el mapa de Google
 * incrustado en la portada y el captcha de Google en el acceso. Ambos son
 * iframes o scripts de Google que ponen cookies suyas.
 *
 * La regla es sencilla: **nada de terceros se carga antes de que el usuario
 * diga que sí**. Por eso la decisión se lee de forma síncrona y se publica en
 * el documento (`data-cookie-consent`), para que quien tenga que cargar algo
 * externo pueda preguntarlo sin esperar a nadie.
 *
 * La elección se guarda en `localStorage`, no en una cookie: guardar la
 * negativa a las cookies en una cookie tiene su gracia, pero es peor — se
 * manda al servidor en cada petición sin ninguna necesidad.
 */

const CLAVE = "arcadia:cookie-consent";
const EVENTO = "arcadia:cookie-consent";

export type Consentimiento = "accepted" | "rejected" | null;

export function leerConsentimiento(): Consentimiento {
  try {
    const valor = localStorage.getItem(CLAVE);
    return valor === "accepted" || valor === "rejected" ? valor : null;
  } catch {
    // Navegación privada con almacenamiento bloqueado: se trata como que aún
    // no ha decidido, y por tanto no se carga nada de terceros.
    return null;
  }
}

/** ¿Se pueden cargar recursos de terceros ahora mismo? */
export function tercerosPermitidos(): boolean {
  return document.documentElement.dataset.cookieConsent === "accepted";
}

function publicar(valor: Consentimiento): void {
  document.documentElement.dataset.cookieConsent = valor ?? "pending";
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: valor }));
}

function guardar(valor: Exclude<Consentimiento, null>): void {
  try {
    localStorage.setItem(CLAVE, valor);
  } catch {
    // Si no se puede guardar, al menos vale para esta visita.
  }
  publicar(valor);
}

// Se publica antes de nada para que el resto de la página no tenga que esperar.
publicar(leerConsentimiento());

const banner = document.querySelector<HTMLElement>("[data-cookie-banner]");

if (banner) {
  if (leerConsentimiento() === null) banner.hidden = false;

  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
    guardar("accepted");
    banner.hidden = true;
  });

  banner.querySelector("[data-cookie-reject]")?.addEventListener("click", () => {
    guardar("rejected");
    banner.hidden = true;
  });
}

/**
 * Permite volver a decidir desde la política de privacidad.
 *
 * Retirar el consentimiento tiene que ser tan fácil como darlo; si sólo se
 * pudiera aceptar, el consentimiento no valdría gran cosa.
 */
document.addEventListener("click", (event) => {
  const disparador = (event.target as HTMLElement | null)?.closest("[data-cookie-settings]");
  if (!disparador) return;

  event.preventDefault();
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer: se recarga igualmente y volverá a preguntar.
  }
  location.reload();
});
