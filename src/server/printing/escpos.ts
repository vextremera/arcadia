/**
 * Generación de ESC/POS para impresoras térmicas de tickets.
 *
 * El modelo de documento (DocNode[]) es deliberadamente pobre: texto con
 * alineación/énfasis, filas a dos columnas, separadores y corte. Todo lo que un
 * ticket necesita y nada más. Los PrintJob guardan ese modelo, no bytes, así que
 * este fichero es el único sitio donde se decide cómo se traduce a comandos —
 * un fallo de codificación o de corte se arregla aquí sin reencolar trabajos.
 *
 * Ancho: 80mm de papel son 72mm imprimibles = 576 puntos = 48 caracteres en
 * Font A (12x24). 58mm son 384 puntos = 32 caracteres.
 */

export type DocAlign = "left" | "center" | "right";
export type DocSize = "normal" | "double" | "doubleHeight";

export type DocNode =
  | { type: "text"; value: string; align?: DocAlign; bold?: boolean; size?: DocSize }
  | { type: "row"; left: string; right: string; bold?: boolean }
  | { type: "rule"; char?: string }
  | { type: "feed"; lines?: number }
  | { type: "cut" }
  | { type: "drawer" };

export type PrintDocument = {
  paperWidth: 58 | 80;
  nodes: DocNode[];
};

/** Caracteres por línea en Font A según el ancho de papel. */
export function charsPerLine(paperWidth: number): number {
  return paperWidth === 58 ? 32 : 48;
}

// --- Comandos ---------------------------------------------------------------

const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  init: [ESC, 0x40],
  /** ESC t 19 → tabla de códigos PC858 (PC850 + símbolo del euro). */
  codepage858: [ESC, 0x74, 19],
  align: (align: DocAlign) => [ESC, 0x61, align === "center" ? 1 : align === "right" ? 2 : 0],
  bold: (on: boolean) => [ESC, 0x45, on ? 1 : 0],
  /** GS ! n — n = (ancho-1)<<4 | (alto-1). */
  size: (size: DocSize) => [GS, 0x21, size === "double" ? 0x11 : size === "doubleHeight" ? 0x01 : 0x00],
  feed: (lines: number) => [ESC, 0x64, Math.max(0, Math.min(255, lines))],
  /** GS V 66 n — avanza n puntos y hace corte parcial. */
  cut: [GS, 0x56, 66, 0x00],
  /** ESC p 0 t1 t2 — pulso al cajón portamonedas. */
  drawer: [ESC, 0x70, 0x00, 0x19, 0xfa],
};

// --- Codificación CP858 -----------------------------------------------------

/**
 * Mapa Unicode → CP858 para los caracteres que aparecen de verdad en un ticket
 * en es/ca/en/fr. Lo que no esté aquí se translitera o cae a '?', porque enviar
 * UTF-8 crudo a una térmica produce basura, no un fallo visible.
 */
const CP858: Record<string, number> = {
  "Ç": 0x80, "ü": 0x81, "é": 0x82, "â": 0x83, "ä": 0x84, "à": 0x85, "å": 0x86,
  "ç": 0x87, "ê": 0x88, "ë": 0x89, "è": 0x8a, "ï": 0x8b, "î": 0x8c, "ì": 0x8d,
  "Ä": 0x8e, "Å": 0x8f, "É": 0x90, "æ": 0x91, "Æ": 0x92, "ô": 0x93, "ö": 0x94,
  "ò": 0x95, "û": 0x96, "ù": 0x97, "ÿ": 0x98, "Ö": 0x99, "Ü": 0x9a, "ø": 0x9b,
  "£": 0x9c, "Ø": 0x9d, "×": 0x9e, "ƒ": 0x9f,
  "á": 0xa0, "í": 0xa1, "ó": 0xa2, "ú": 0xa3, "ñ": 0xa4, "Ñ": 0xa5, "ª": 0xa6,
  "º": 0xa7, "¿": 0xa8, "®": 0xa9, "¬": 0xaa, "½": 0xab, "¼": 0xac, "¡": 0xad,
  "«": 0xae, "»": 0xaf,
  "Á": 0xb5, "Â": 0xb6, "À": 0xb7, "©": 0xb8,
  "ã": 0xc6, "Ã": 0xc7,
  "ð": 0xd0, "Ð": 0xd1, "Ê": 0xd2, "Ë": 0xd3, "È": 0xd4,
  "€": 0xd5,
  "Í": 0xd6, "Î": 0xd7, "Ï": 0xd8, "Ì": 0xde,
  "Ó": 0xe0, "ß": 0xe1, "Ô": 0xe2, "Ò": 0xe3, "õ": 0xe4, "Õ": 0xe5,
  "þ": 0xe7, "Þ": 0xe8, "Ú": 0xe9, "Û": 0xea, "Ù": 0xeb, "ý": 0xec, "Ý": 0xed,
  "¯": 0xee, "±": 0xf1, "¾": 0xf3, "§": 0xf5, "°": 0xf8,
  /** Punt volat catalá (l·l). */
  "·": 0xfa,
};

/** Sustituciones para caracteres tipográficos que se cuelan desde el admin. */
const TRANSLITERATE: Record<string, string> = {
  "‘": "'", "’": "'", "“": '"', "”": '"',
  "–": "-", "—": "-", "…": "...", " ": " ",
};

function encodeChar(char: string): number {
  const code = char.codePointAt(0) ?? 63;
  if (code < 0x80) return code;

  const mapped = CP858[char];
  if (mapped !== undefined) return mapped;

  // Último recurso: quitar el diacrítico antes de rendirse.
  const stripped = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const strippedCode = stripped.codePointAt(0);
  if (stripped.length === 1 && strippedCode !== undefined && strippedCode < 0x80) {
    return strippedCode;
  }

  return 0x3f; // '?'
}

export function encodeText(value: string): number[] {
  const normalized = value.replace(/[\u2018\u2019\u201c\u201d\u2013\u2014\u2026\u00a0]/g, (c) => TRANSLITERATE[c] ?? c);
  return [...normalized].flatMap((char) => encodeChar(char));
}

// --- Composición de líneas --------------------------------------------------

/**
 * Parte un texto en líneas que quepan en el papel, respetando palabras.
 * Una palabra más larga que la línea se corta en seco: es preferible a que la
 * impresora la parta por su cuenta en un sitio impredecible.
 */
export function wrapText(value: string, width: number): string[] {
  const out: string[] = [];

  for (const paragraph of value.split("\n")) {
    if (!paragraph.trim()) {
      out.push("");
      continue;
    }

    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (word.length > width) {
        if (current) { out.push(current); current = ""; }
        for (let i = 0; i < word.length; i += width) out.push(word.slice(i, i + width));
        continue;
      }

      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > width) {
        out.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) out.push(current);
  }

  return out.length ? out : [""];
}

/** Fila a dos columnas: etiqueta a la izquierda, importe pegado a la derecha. */
export function twoColumn(left: string, right: string, width: number): string {
  const rightText = right.slice(0, width);
  const room = width - rightText.length - 1;

  if (room <= 0) return rightText.padStart(width);

  const leftText = left.length > room ? left.slice(0, room) : left;
  return leftText.padEnd(width - rightText.length) + rightText;
}

// --- Render -----------------------------------------------------------------

export function renderEscPos(doc: PrintDocument): Uint8Array {
  const width = charsPerLine(doc.paperWidth);
  const bytes: number[] = [...CMD.init, ...CMD.codepage858];

  let cutSeen = false;

  for (const node of doc.nodes) {
    switch (node.type) {
      case "text": {
        const size = node.size ?? "normal";
        // A doble ancho caben la mitad de caracteres por línea.
        const effectiveWidth = size === "double" ? Math.floor(width / 2) : width;

        bytes.push(...CMD.align(node.align ?? "left"));
        if (node.bold) bytes.push(...CMD.bold(true));
        if (size !== "normal") bytes.push(...CMD.size(size));

        for (const line of wrapText(node.value, effectiveWidth)) {
          bytes.push(...encodeText(line), 0x0a);
        }

        if (size !== "normal") bytes.push(...CMD.size("normal"));
        if (node.bold) bytes.push(...CMD.bold(false));
        bytes.push(...CMD.align("left"));
        break;
      }

      case "row": {
        if (node.bold) bytes.push(...CMD.bold(true));
        bytes.push(...encodeText(twoColumn(node.left, node.right, width)), 0x0a);
        if (node.bold) bytes.push(...CMD.bold(false));
        break;
      }

      case "rule": {
        const char = (node.char ?? "-").slice(0, 1);
        bytes.push(...encodeText(char.repeat(width)), 0x0a);
        break;
      }

      case "feed":
        bytes.push(...CMD.feed(node.lines ?? 1));
        break;

      case "cut":
        bytes.push(...CMD.cut);
        cutSeen = true;
        break;

      case "drawer":
        bytes.push(...CMD.drawer);
        break;
    }
  }

  // Sin corte el ticket se queda colgando y el siguiente se imprime encima.
  if (!cutSeen) bytes.push(...CMD.feed(4), ...CMD.cut);

  return Uint8Array.from(bytes);
}

/** Serializa el documento a base64 para transportarlo por JSON hasta el bridge. */
export function renderEscPosBase64(doc: PrintDocument): string {
  const bytes = renderEscPos(doc);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
