import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { erreurCoordonnees, profilIncomplet } from "../src/lib/coordonnees";
import { messageErreurSociale, nouvelEtat, urlAutorisation, urlRetour } from "../src/lib/oauth";
import { courrielReinitialisation } from "../src/lib/reinitialisation";

const valides = { firstName: "Hanta", lastName: "Rakoto", company: "Baobab Conseil", role: "Gérante", phone: "+261 34 00 000 00" };

describe("coordonnées de l’inscription et de « Compléter votre profil »", () => {
  it("accepte un profil complet et refuse chaque champ manquant ou invalide", () => {
    assert.equal(erreurCoordonnees(valides), null);
    assert.match(erreurCoordonnees({ ...valides, company: "" }) ?? "", /entreprise/);
    assert.match(erreurCoordonnees({ ...valides, phone: "12" }) ?? "", /téléphone/);
    assert.match(erreurCoordonnees({ ...valides, firstName: "x".repeat(61) }) ?? "", /trop long/);
  });

  it("repère les comptes créés avec Google ou Facebook qui doivent compléter leur profil", () => {
    assert.equal(profilIncomplet({ company: null, role: null, phone: null }), true);
    assert.equal(profilIncomplet({ company: "Baobab", role: "Gérante", phone: "+261 34 00 000 00" }), false);
  });
});

describe("connexion avec Google et Facebook", () => {
  it("envoie vers Google avec l’état, le défi PKCE et l’adresse de retour", () => {
    process.env.GOOGLE_CLIENT_ID = "client-test";
    const { state, defi, verificateur } = nouvelEtat();
    assert.notEqual(state, verificateur);
    const url = new URL(urlAutorisation("google", { state, defi, redirectUri: urlRetour("https://latraversee.example", "google") }));
    assert.equal(url.origin, "https://accounts.google.com");
    assert.equal(url.searchParams.get("state"), state);
    assert.equal(url.searchParams.get("code_challenge"), defi);
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.equal(url.searchParams.get("redirect_uri"), "https://latraversee.example/api/auth/google/callback");
    assert.equal(url.searchParams.get("scope"), "openid email profile");
  });

  it("demande l’adresse e-mail à Facebook", () => {
    process.env.FACEBOOK_APP_ID = "app-test";
    const url = new URL(urlAutorisation("facebook", { state: "s", defi: "d", redirectUri: "https://latraversee.example/api/auth/facebook/callback" }));
    assert.equal(url.hostname, "www.facebook.com");
    assert.equal(url.searchParams.get("client_id"), "app-test");
    assert.equal(url.searchParams.get("scope"), "email,public_profile");
  });

  it("traduit les codes d’erreur du retour, et ignore les codes inconnus", () => {
    assert.equal(messageErreurSociale("refus", "google"), "Connexion avec Google annulée.");
    assert.match(messageErreurSociale("email", "facebook") ?? "", /Facebook ne partage pas/);
    assert.match(messageErreurSociale("admin", "google") ?? "", /administrateur/);
    assert.equal(messageErreurSociale("<script>", "google"), null);
    assert.equal(messageErreurSociale(undefined, undefined), null);
  });
});

describe("e-mail « mot de passe oublié »", () => {
  it("contient le lien et échappe le prénom dans la version HTML", () => {
    const lien = "https://latraversee.example/mot-de-passe-oublie/abc";
    const c = courrielReinitialisation("hanta@exemple.mg", "<b>Hanta</b>", lien);
    assert.equal(c.a, "hanta@exemple.mg");
    assert.ok(c.texte.includes(lien));
    assert.ok(c.html.includes(`href="${lien}"`));
    assert.ok(!c.html.includes("<b>Hanta</b>"));
    assert.ok(c.html.includes("&lt;b&gt;Hanta&lt;/b&gt;"));
  });
});
