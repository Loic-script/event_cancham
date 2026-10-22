import assert from "node:assert/strict";
import { test } from "node:test";
import { FENETRE_MS, MAX_ECHECS_EMAIL, messageBlocage, minutesDeBlocage } from "../src/lib/connexion-limite";

const maintenant = Date.parse("2026-12-18T18:30:00Z");
const ilYA = (ms: number) => new Date(maintenant - ms);

test("pas de blocage sous le seuil d'échecs", () => {
  assert.equal(minutesDeBlocage([], MAX_ECHECS_EMAIL, maintenant), 0);
  assert.equal(minutesDeBlocage(Array.from({ length: MAX_ECHECS_EMAIL - 1 }, () => ilYA(1000)), MAX_ECHECS_EMAIL, maintenant), 0);
});

test("blocage au seuil, pour le temps qui reste dans la fenêtre", () => {
  const echecs = Array.from({ length: MAX_ECHECS_EMAIL }, (_, i) => ilYA((i + 1) * 60_000));
  // Dernier échec il y a 1 minute : il reste 14 minutes sur une fenêtre de 15.
  assert.equal(minutesDeBlocage(echecs, MAX_ECHECS_EMAIL, maintenant), 14);
  assert.equal(messageBlocage(14), "Trop de tentatives. Réessayez dans 14 minutes.");
  assert.equal(messageBlocage(1), "Trop de tentatives. Réessayez dans 1 minute.");
});

test("les échecs sortis de la fenêtre ne comptent plus", () => {
  const vieux = Array.from({ length: MAX_ECHECS_EMAIL }, () => ilYA(FENETRE_MS + 1000));
  assert.equal(minutesDeBlocage(vieux, MAX_ECHECS_EMAIL, maintenant), 0);
  const mixte = [...vieux, ilYA(1000), ilYA(2000)];
  assert.equal(minutesDeBlocage(mixte, MAX_ECHECS_EMAIL, maintenant), 0);
});

test("au moins une minute annoncée même à la toute fin de la fenêtre", () => {
  const echecs = Array.from({ length: MAX_ECHECS_EMAIL }, () => ilYA(FENETRE_MS - 5000));
  assert.equal(minutesDeBlocage(echecs, MAX_ECHECS_EMAIL, maintenant), 1);
});
