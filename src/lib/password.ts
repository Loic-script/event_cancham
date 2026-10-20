import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltEncoded, keyEncoded] = stored.split("$");
  if (scheme !== "scrypt" || !saltEncoded || !keyEncoded) return false;

  const salt = Buffer.from(saltEncoded, "base64url");
  const expected = Buffer.from(keyEncoded, "base64url");
  const key = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * Vérifie un mot de passe saisi ou collé. Un copier-coller depuis un e-mail ajoute souvent des espaces ou une tabulation
 * autour : si la saisie exacte échoue, on essaie aussi la saisie sans ces blancs.
 */
export async function verifierMotDePasseSaisi(saisie: string, stored: string): Promise<boolean> {
  if (await verifyPassword(saisie, stored)) return true;
  const sansBlancs = saisie.trim();
  return sansBlancs !== saisie && sansBlancs.length > 0 && (await verifyPassword(sansBlancs, stored));
}

/** Mot de passe provisoire lisible (sans 0/O ni 1/l/I), par exemple « Kx7m-P2qr-Hn9d » : environ 69 bits d'aléa. */
export function genererMotDePasse(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bloc = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return [bloc(), bloc(), bloc()].join("-");
}
