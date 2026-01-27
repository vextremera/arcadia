import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options?: ScryptOptions
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, keylen, options ?? {}, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

// Parámetros razonables para web (ajustables)
// En Node: cost ~ N, blockSize ~ r, parallelization ~ p
const SCRYPT_OPTS: ScryptOptions = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  // maxmem: 64 * 1024 * 1024, // opcional
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 32, SCRYPT_OPTS);

  return `scrypt$${SCRYPT_OPTS.cost}$${SCRYPT_OPTS.blockSize}$${SCRYPT_OPTS.parallelization}$${salt.toString(
    "base64"
  )}$${key.toString("base64")}`;
}

export async function verifyPassword(stored: string, password: string) {
  if (!stored.startsWith("scrypt$")) return false;

  const parts = stored.split("$");
  // scrypt$cost$blockSize$parallelization$salt$key
  if (parts.length !== 6) return false;

  const [, costStr, blockStr, parStr, saltB64, keyB64] = parts;

  const cost = Number(costStr);
  const blockSize = Number(blockStr);
  const parallelization = Number(parStr);

  if (![cost, blockSize, parallelization].every(Number.isFinite)) return false;

  const salt = Buffer.from(saltB64, "base64");
  const key = Buffer.from(keyB64, "base64");

  const derived = await scryptAsync(password, salt, key.length, {
    cost,
    blockSize,
    parallelization,
  });

  return timingSafeEqual(derived, key);
}
