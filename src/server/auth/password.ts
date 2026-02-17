import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

// formato: scrypt$N$r$p$saltB64$hashB64
export function hashPassword(raw: string) {
  const password = String(raw ?? "").normalize("NFKC");
  const salt = randomBytes(16);

  const N = 16384;
  const r = 8;
  const p = 1;

  const key = scryptSync(password, salt, KEYLEN, { N, r, p }) as Buffer;

  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(raw: string, stored: string) {
  const password = String(raw ?? "").normalize("NFKC");
  const parts = String(stored ?? "").split("$");

  if (parts.length !== 6) return false;
  const [alg, Nstr, rstr, pstr, saltB64, hashB64] = parts;
  if (alg !== "scrypt") return false;

  const N = Number(Nstr);
  const r = Number(rstr);
  const p = Number(pstr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== KEYLEN) return false;

  const derived = scryptSync(password, salt, KEYLEN, { N, r, p }) as Buffer;

  return timingSafeEqual(derived, expected);
}
