import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const LONGUEUR = 64;

function deriver(motDePasse: string, sel: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(motDePasse.normalize("NFKC"), sel, LONGUEUR, { N: 16384, r: 8, p: 1 }, (err, cle) => (err ? reject(err) : resolve(cle)));
  });
}

export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  const cle = await deriver(motDePasse, sel);
  return `scrypt$${sel.toString("base64url")}$${cle.toString("base64url")}`;
}

export async function verifierMotDePasse(motDePasse: string, empreinte: string): Promise<boolean> {
  const [algo, selTxt, cleTxt] = empreinte.split("$");
  if (algo !== "scrypt" || !selTxt || !cleTxt) return false;
  const attendue = Buffer.from(cleTxt, "base64url");
  const calculee = await deriver(motDePasse, Buffer.from(selTxt, "base64url"));
  return attendue.length === calculee.length && timingSafeEqual(attendue, calculee);
}
