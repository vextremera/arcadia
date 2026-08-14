/**
 * Formato de importes de la parte pública.
 *
 * Existe porque la misma función estaba copiada en doce sitios (carta, carrito,
 * checkout, configurador, upsell, pedido, pasarela, cuenta…) y todas usaban
 * punto decimal: en español el separador es la coma, así que un plato de 12,20 €
 * salía como "12.20 €" en toda la web.
 *
 * Los importes se guardan en céntimos (ver db/config.ts), así que la entrada es
 * siempre un entero.
 */

/** 1220 → "12,20 €" */
export function formatEuros(cents: number): string {
  return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")} €`;
}

/** 150 → "+1,50 €" · -300 → "−3,00 €" (signo explícito, para deltas). */
export function formatEurosSigned(cents: number): string {
  const value = Number(cents ?? 0);
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatEuros(Math.abs(value))}`;
}
