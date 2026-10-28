import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { erreurCoordonnees, profilIncomplet } from "../src/lib/coordonnees";
import { messageErreurSociale, nouvelEtat, urlAutorisation, urlRetour } from "../src/lib/oauth";
import { courrielNouveauMembre, courrielNouvelAdmin, courrielNouvelleInscription, courrielPromotionAdmin, courrielReinitialisation } from "../src/lib/courriels";
import { adressesSuperAdmins, estSuperAdmin } from "../src/lib/super-admin";
import { genererMotDePasse, hashPassword, verifierMotDePasseSaisi } from "../src/lib/password";

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

describe("e-mails aux administrateurs", () => {
  it("génère des mots de passe provisoires lisibles et tous différents", () => {
    const lot = Array.from({ length: 200 }, genererMotDePasse);
    for (const m of lot) assert.match(m, /^[a-km-zA-HJ-NP-Z2-9]{4}-[a-km-zA-HJ-NP-Z2-9]{4}-[a-km-zA-HJ-NP-Z2-9]{4}$/);
    assert.equal(new Set(lot).size, lot.length);
  });

  it("annonce une nouvelle inscription à tous les administrateurs, données échappées", () => {
    const c = courrielNouvelleInscription(
      { firstName: "Hanta", lastName: "<i>Rakoto</i>", email: "hanta@exemple.mg", company: "Baobab", role: "Gérante", phone: "+261 34 00 000 00", via: "avec Google" },
      ["a@cancham.mg", "b@cancham.mg"],
      "https://latraversee.example",
    );
    assert.deepEqual(c.a, ["a@cancham.mg", "b@cancham.mg"]);
    assert.equal(c.sujet, "Nouvelle inscription : Hanta <i>Rakoto</i> (Baobab)");
    assert.ok(c.html.includes('href="https://latraversee.example/admin/utilisateurs"'));
    assert.ok(!c.html.includes("<i>Rakoto</i>"));
    assert.ok(c.texte.includes("Téléphone : +261 34 00 000 00") && c.texte.includes("Inscription : avec Google"));
    assert.ok(courrielNouvelleInscription({ firstName: "A", lastName: "B", email: "a@b.mg", company: null, role: null, phone: null, via: "par le formulaire" }, ["x@y.mg"], null).texte.includes("Demandes d’accès"));
  });

  it("envoie au nouvel administrateur son mot de passe provisoire et le lien de connexion", () => {
    const c = courrielNouvelAdmin({ email: "nouveau@cancham.mg", prenom: "Tiana", createur: "Admin CanCham", motDePasse: "Kx7m-P2qr-Hn9d", base: "https://latraversee.example" });
    assert.equal(c.a, "nouveau@cancham.mg");
    assert.ok(c.texte.includes("Kx7m-P2qr-Hn9d") && c.html.includes("Kx7m-P2qr-Hn9d"));
    assert.ok(c.html.includes('href="https://latraversee.example/connexion"'));
    assert.ok(c.texte.includes("Mon compte"));
  });
});

describe("super admin", () => {
  it("lit SUPER_ADMINS sans tenir compte des majuscules ni des espaces", () => {
    process.env.SUPER_ADMINS = " Info@CanCham.mg , autre@cancham.mg,";
    assert.deepEqual(adressesSuperAdmins(), ["info@cancham.mg", "autre@cancham.mg"]);
    assert.equal(estSuperAdmin({ acces: "ADMIN", email: "INFO@cancham.mg" }), true);
  });

  it("exige aussi le rôle administrateur en base", () => {
    process.env.SUPER_ADMINS = "info@cancham.mg";
    assert.equal(estSuperAdmin({ acces: "MEMBRE", email: "info@cancham.mg" }), false);
    assert.equal(estSuperAdmin({ acces: "ADMIN", email: "admin@cancham.mg" }), false);
    process.env.SUPER_ADMINS = "";
    assert.equal(estSuperAdmin({ acces: "ADMIN", email: "info@cancham.mg" }), false);
  });

  it("donne au membre promu un nouveau mot de passe et le lien de connexion", () => {
    const c = courrielPromotionAdmin({ email: "membre@cancham.mg", prenom: "Marco", createur: "Équipe CanCham", motDePasse: "wWP7-MErq-DTZr", base: "https://latraversee.example" });
    assert.ok(c.texte.includes("Mot de passe : wWP7-MErq-DTZr") && c.texte.includes("remplace l’ancien"));
    assert.ok(c.html.includes('href="https://latraversee.example/connexion"'));
  });
});

describe("mot de passe collé depuis un e-mail", () => {
  it("accepte des espaces ou une tabulation autour, et refuse toujours un mauvais mot de passe", async () => {
    const hash = await hashPassword("ccNP-XXmR-KGYU");
    assert.equal(await verifierMotDePasseSaisi("ccNP-XXmR-KGYU", hash), true);
    assert.equal(await verifierMotDePasseSaisi("  ccNP-XXmR-KGYU ", hash), true);
    assert.equal(await verifierMotDePasseSaisi("\tccNP-XXmR-KGYU\n", hash), true);
    assert.equal(await verifierMotDePasseSaisi("ccNP-XXmR-KGYX", hash), false);
    assert.equal(await verifierMotDePasseSaisi("   ", hash), false);
  });

  it("garde un mot de passe choisi avec des espaces autour", async () => {
    const hash = await hashPassword(" espace devant");
    assert.equal(await verifierMotDePasseSaisi(" espace devant", hash), true);
  });
});

describe("logo des e-mails", () => {
  it("affiche le logo Impact 261 en image intégrée dans chaque e-mail", () => {
    const base = "https://latraversee.example";
    for (const c of [
      courrielReinitialisation("a@b.mg", "A", `${base}/mot-de-passe-oublie/x`),
      courrielNouvelAdmin({ email: "a@b.mg", prenom: "A", createur: "B", motDePasse: "x", base }),
      courrielPromotionAdmin({ email: "a@b.mg", prenom: "A", createur: "B", motDePasse: "x", base }),
      courrielNouvelleInscription({ firstName: "A", lastName: "B", email: "a@b.mg", company: null, role: null, phone: null, via: "par le formulaire" }, ["x@y.mg"], base),
    ]) {
      assert.ok(c.html.includes('src="cid:logo-impact"'), c.sujet);
      assert.ok(c.html.includes('alt="Impact 261"'), c.sujet);
    }
  });
});

describe("e-mail d'un compte créé par un administrateur", () => {
  it("invite à créer son mot de passe par un lien, sans mot de passe dans l'e-mail", () => {
    const lien = "https://impact261.com/creer-mot-de-passe/abc";
    const c = courrielNouveauMembre({ email: "membre@exemple.mg", prenom: "Miora", createur: "Faneva Loïc", lien });
    assert.equal(c.a, "membre@exemple.mg");
    assert.match(c.sujet, /créez votre mot de passe/);
    assert.ok(c.texte.includes(lien) && c.html.includes(lien));
    assert.ok(c.texte.includes("Faneva Loïc"));
    assert.match(c.html, /Créer mon mot de passe/);
    assert.doesNotMatch(c.texte, /provisoire/);
    assert.doesNotMatch(c.html, /provisoire/);
    assert.match(c.texte, /7 jours/);
  });
});
