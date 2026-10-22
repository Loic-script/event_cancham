import assert from "node:assert/strict";
import { test } from "node:test";
import { etatNormalise, lienOperateur, lireNotification, messagePourLePayeur, signatureValide, signer, transactionDepuisUrl } from "../src/lib/vanillapay";

/** Client Vanilla Pay : signature des notifications, lecture des deux formats, identifiant de transaction. Sans réseau. */
const CLE = "cle-secrete-de-test";
const corps = JSON.stringify({ reference: "LT-2026-ABC234", etat: "SUCCESS", montant: 500000 });

test("signature : HMAC-SHA256 hexadécimal majuscule, acceptée quelle que soit la casse reçue", () => {
  const s = signer(corps, CLE);
  assert.match(s, /^[0-9A-F]{64}$/);
  assert.equal(signatureValide(corps, s, CLE), true);
  assert.equal(signatureValide(corps, s.toLowerCase(), CLE), true);
  assert.equal(signatureValide(corps, ` ${s} `, CLE), true);
});

test("signature : fausse, absente, autre clé ou corps modifié → refusée", () => {
  const s = signer(corps, CLE);
  assert.equal(signatureValide(corps, "0".repeat(64), CLE), false);
  assert.equal(signatureValide(corps, null, CLE), false);
  assert.equal(signatureValide(corps, "", CLE), false);
  assert.equal(signatureValide(corps, s, "autre-cle"), false);
  assert.equal(signatureValide(corps + " ", s, CLE), false);
  // Sans clé configurée, rien ne passe.
  assert.equal(signatureValide(corps, signer(corps, ""), ""), false);
});

test("notification JSON, champs sous Data, montant_mga prioritaire pour la carte", () => {
  const n = lireNotification(JSON.stringify({ CodeRetour: 200, Data: { reference_VPI: "VPI1", reference: "LT-2026-ABC234", panier: "LT-2026-ABC234", montant: 112, devise: "EUR", montant_mga: "500000", etat: "SUCCESS", initiateur: "0341234567" } }), "application/json");
  assert.equal(n.reference, "LT-2026-ABC234");
  assert.equal(n.referenceVPI, "VPI1");
  assert.equal(n.etat, "reussi");
  assert.equal(n.etatBrut, "SUCCESS");
  assert.equal(n.montantAriary, 500000);
  assert.equal(n.initiateur, "0341234567");
});

test("notification encodée en formulaire, mobile money, état FAILED", () => {
  const n = lireNotification(new URLSearchParams({ reference: "LT-2026-ABC234", montant: "500000", etat: "FAILED", referenceMM: "MM-42" }).toString(), "application/x-www-form-urlencoded");
  assert.equal(n.reference, "LT-2026-ABC234");
  assert.equal(n.etat, "echoue");
  assert.equal(n.montantAriary, 500000);
  assert.equal(n.referenceMM, "MM-42");
});

test("notification sans référence ni montant, ou illisible", () => {
  const n = lireNotification("{pas du json", "application/json");
  assert.equal(n.reference, null);
  assert.equal(n.montantAriary, null);
  assert.equal(n.etat, "en_cours");
  assert.equal(lireNotification(JSON.stringify({ reference: "LT-2026-ABC234", etat: "INITIATED" })).etat, "en_cours");
});

test("états normalisés", () => {
  assert.equal(etatNormalise("SUCCESS"), "reussi");
  assert.equal(etatNormalise(" success "), "reussi");
  assert.equal(etatNormalise("FAILED"), "echoue");
  assert.equal(etatNormalise("INITIATED"), "en_cours");
  assert.equal(etatNormalise(undefined), "en_cours");
});

test("identifiant de transaction lu dans l'adresse de paiement, lien opérateur", () => {
  const id = ["xxx", Buffer.from("TX-123", "utf8").toString("base64url"), "zzz"].join(".");
  const url = `https://bo.vanilla-pay.net/webpayment/v2/pay?id=${id}`;
  assert.equal(transactionDepuisUrl(url), "TX-123");
  assert.equal(transactionDepuisUrl("https://bo.vanilla-pay.net/webpayment/v2/pay"), null);
  assert.equal(transactionDepuisUrl("pas une adresse"), null);
  const lien = new URL(lienOperateur(url, "MVOLA"));
  assert.equal(lien.pathname, "/api/mobileMoney/selectChoice/addNumero");
  assert.equal(lien.searchParams.get("id"), id);
  assert.equal(lien.searchParams.get("type"), "MVOLA");
  // Hors du prestataire (simulateur local), l'adresse normale est gardée.
  const locale = `http://localhost:3000/simulateur-vanillapay/payer?id=${id}`;
  assert.equal(lienOperateur(locale, "MVOLA"), locale);
});

test("messages connus du prestataire traduits pour le payeur", () => {
  assert.match(messagePourLePayeur("Paiement international non activé"), /pas encore activé/);
  assert.match(messagePourLePayeur("MVOLA indisponible"), /MVola est indisponible/);
  assert.match(messagePourLePayeur("Le panier ne doit pas dépasser 20 caractères"), /Référence de paiement trop longue/);
  assert.match(messagePourLePayeur(null), /ne répond pas/);
});
