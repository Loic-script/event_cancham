import "dotenv/config";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { dureeLecture, premierePhoto, type Bloc } from "../src/lib/ressources/blocs";
import { pdfSimple, type PagePdf } from "../src/lib/ressources/pdf-simple";
import { dossierBlocs, dossierImages, dossierRessource, dossierTemp } from "../src/lib/ressources/stockage";
import { genererCouverture, normaliserImage, traiterEnvoi } from "../src/lib/ressources/traitement";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "faneva.loic@event-studio.mg";
const DEMO_PASSWORD = "LaTraversee2026!";

const TEST_ACCOUNTS = [
  { email: "membre@gmail.com", password: "12345678", firstName: "Membre", lastName: "Test", acces: "MEMBRE" },
  { email: "admin@gmail.com", password: "12345678", firstName: "Admin", lastName: "CanCham", acces: "ADMIN" },
] as const;

async function seedComptes() {
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      firstName: "Faneva",
      lastName: "Loïc",
      role: "Fondateur",
      company: "Event Studio",
      statut: "ACTIF",
      city: "Antananarivo",
      country: "MG",
    },
  });

  for (const account of TEST_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, acces: account.acces, statut: "ACTIF" },
      create: {
        email: account.email,
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        acces: account.acces,
        statut: "ACTIF",
      },
    });
  }
  console.log(`Comptes à jour : ${DEMO_EMAIL}, ${TEST_ACCOUNTS.map((a) => a.email).join(", ")}.`);
}

const image = (nom: string) => path.join(process.cwd(), "public", "traversee", `${nom}.jpg`);

async function seedEvenements() {
  if ((await prisma.event.count()) > 0) return;

  await prisma.event.createMany({
    data: [
      {
        title: "Lancement du projet",
        description: "Réunion de démarrage avec toute l'équipe.",
        location: "Antananarivo",
        startsAt: new Date("2026-11-02T09:00:00Z"),
        endsAt: new Date("2026-11-02T11:00:00Z"),
      },
      {
        title: "Atelier entrepreneurs",
        description: "Atelier pratique sur le montage de projet.",
        location: "En ligne",
        startsAt: new Date("2026-11-15T14:00:00Z"),
        endsAt: new Date("2026-11-15T17:00:00Z"),
      },
    ],
    skipDuplicates: true,
  });
}

async function imageDossier(id: string, source: string, nom: "couverture.jpg" | "auteur.jpg") {
  const dest = path.join(dossierImages(id), nom);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const base = sharp(source).rotate();
  if (nom === "auteur.jpg") await base.resize(400, 400, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
  else await base.resize({ width: 1600, height: 900, fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
  return nom;
}

async function photoBloc(ressourceId: string, source: string): Promise<string> {
  const nom = `${randomUUID()}.webp`;
  await normaliserImage(source, path.join(dossierBlocs(ressourceId), nom), "webp", 1600);
  return nom;
}

type Base = { titre: string; categorie: "guide" | "modele" | "formation" | "rapport"; description: string; dossierId: string | null; ordre: number; date: string };

async function ressourcePdf(b: Base, pages: PagePdf[]) {
  const r = await prisma.ressource.create({ data: { ...cles(b), format: "pdf" } });
  await fs.mkdir(dossierTemp(), { recursive: true });
  const tmp = path.join(dossierTemp(), randomUUID());
  const donnees = pdfSimple(pages);
  await fs.writeFile(tmp, donnees);
  const res = await traiterEnvoi(r.id, { chemin: tmp, octets: donnees.byteLength, entete: donnees.subarray(0, 64) }, `${b.titre}.pdf`, false);
  await prisma.ressource.update({ where: { id: r.id }, data: { format: res.format, fichier: res.fichier, pages: res.pages, taille: res.taille, tailleOctets: BigInt(res.tailleOctets), couverture: res.couverture } });
  return r.id;
}

async function ressourcePhoto(b: Base, source: string) {
  const r = await prisma.ressource.create({ data: { ...cles(b), format: "photo" } });
  await fs.mkdir(dossierTemp(), { recursive: true });
  const tmp = path.join(dossierTemp(), randomUUID());
  await fs.copyFile(source, tmp);
  const donnees = await fs.readFile(tmp);
  const res = await traiterEnvoi(r.id, { chemin: tmp, octets: donnees.byteLength, entete: donnees.subarray(0, 64) }, path.basename(source), false);
  await prisma.ressource.update({ where: { id: r.id }, data: { format: res.format, fichier: res.fichier, pages: res.pages, taille: res.taille, tailleOctets: BigInt(res.tailleOctets), couverture: res.couverture } });
  return r.id;
}

async function ressourcePage(b: Base, construire: (id: string) => Promise<Bloc[]>) {
  const r = await prisma.ressource.create({ data: { ...cles(b), format: "page" } });
  const blocs = await construire(r.id);
  const photo = premierePhoto(blocs);
  let couverture: string | null = null;
  if (photo) {
    await genererCouverture(path.join(dossierBlocs(r.id), photo), path.join(dossierRessource(r.id), "couverture.jpg"));
    couverture = "couverture.jpg";
  }
  await prisma.ressource.update({ where: { id: r.id }, data: { contenu: blocs as unknown as object, taille: dureeLecture(blocs), couverture } });
  return r.id;
}

function cles(b: Base) {
  return { titre: b.titre, categorie: b.categorie, description: b.description, dossierId: b.dossierId, ordre: b.ordre, date: new Date(`${b.date}T09:00:00Z`) };
}

const id = () => `b-${randomUUID().slice(0, 12)}`;

function jourMecc(jour: string, titre: string, lieu: string, adresse: string, horaire: string, description: string): (rid: string) => Promise<Bloc[]> {
  return async () => [
    { id: id(), type: "titre", niveau: 2, texte: titre, align: "left", couleur: "#d9560c" },
    {
      id: id(),
      type: "texte",
      paragraphes: [
        { type: "p", align: "left", items: [[{ t: "Description de l’événement :", b: true, couleur: "#12305a" }]] },
        { type: "p", align: "left", items: [[{ t: description }]] },
        { type: "p", align: "left", items: [[{ t: "Horaire : ", b: true, couleur: "#12305a" }, { t: horaire }]] },
        { type: "p", align: "left", items: [[{ t: "Lieu : ", b: true, couleur: "#12305a" }, { t: lieu }]] },
        { type: "p", align: "left", items: [[{ t: "Adresse : ", b: true, couleur: "#12305a" }, { t: adresse }]] },
        { type: "ul", align: "left", items: [[{ t: "Tenue : " , b: true }, { t: "business" }], [{ t: "Inscription : ", b: true }, { t: "auprès de l’équipe CanCham, " }, { t: "écrire à l’équipe", lien: "mailto:contact@cancham.mg" }]] },
      ],
    },
    { id: id(), type: "titre", niveau: 3, texte: jour, align: "left", couleur: "#4f6072" },
  ];
}

async function seedBibliotheque() {
  if ((await prisma.ressource.count()) > 0) {
    console.log("Bibliothèque déjà présente : seed ignoré.");
    return;
  }
  const kit = await prisma.dossier.create({ data: { nom: "Kit du participant", ordre: 1 } });
  await prisma.dossier.update({ where: { id: kit.id }, data: { couverture: await imageDossier(kit.id, image("accueil"), "couverture.jpg") } });

  await ressourcePage(
    { titre: "Bienvenue à La Traversée", categorie: "guide", description: "Tout ce qu’il faut savoir avant le Gala des 10 ans de la CanCham : déroulé, accès, contacts.", dossierId: kit.id, ordre: 1, date: "2026-10-01" },
    async (rid) => [
      { id: id(), type: "titre", niveau: 2, texte: "Bienvenue à La Traversée", align: "left", couleur: "#12305a" },
      {
        id: id(),
        type: "texte",
        paragraphes: [
          { type: "p", align: "left", items: [[{ t: "Le " }, { t: "vendredi 18 décembre 2026", b: true }, { t: ", la Chambre de Commerce et de Coopération Canada-Madagascar fête ses " }, { t: "10 ans", b: true, couleur: "#d9560c" }, { t: " au CCI Ivato." }]] },
          { type: "ol", align: "left", items: [[{ t: "18 h 30 : accueil et cocktail" }], [{ t: "19 h 30 : pitch des finalistes" }], [{ t: "21 h : dîner de gala et remise des prix", i: true }]] },
          { type: "p", align: "center", items: [[{ t: "Une question ? ", taille: "grand" }, { t: "Écrivez à l’équipe", lien: "mailto:contact@cancham.mg", taille: "grand" }]] },
        ],
      },
      { id: id(), type: "photo", fichier: await photoBloc(rid, image("salle")), legende: "La salle du gala, CCI Ivato." },
      { id: id(), type: "titre", niveau: 3, texte: "Bon à savoir", align: "left" },
      { id: id(), type: "texte", paragraphes: [{ type: "ul", align: "left", items: [[{ t: "Tenue de soirée", b: true }], [{ t: "Badge nominatif à retirer à l’accueil" }], [{ t: "Navette depuis le centre-ville", s: true }, { t: " : remplacée par un parking gratuit" }]] }] },
    ],
  );
  await ressourcePdf(
    { titre: "Guide du participant", categorie: "guide", description: "Le guide complet de la soirée : programme, plan de salle, défis et contacts utiles.", dossierId: kit.id, ordre: 2, date: "2026-10-05" },
    [
      { titre: "Guide du participant", lignes: ["La Traversée · Gala des 10 ans de la CanCham", "Vendredi 18 décembre 2026 · CCI Ivato, Antananarivo", "", "Ce guide accompagne votre soirée."] },
      { titre: "Programme", lignes: ["18 h 30 · Accueil et cocktail", "19 h 30 · Pitch des trois finalistes", "20 h 30 · Second vote du public", "21 h · Dîner de gala"] },
      { titre: "Les défis", lignes: ["Gagnez un voyage au Canada : défi Pitch MECC 2027", "Gagnez 3 000 000 Ar : publication « J’y serai »"] },
      { titre: "Contacts", lignes: ["Équipe CanCham : contact@cancham.mg", "Urgences sur place : accueil du CCI Ivato"] },
    ],
  );
  await ressourcePhoto({ titre: "Plan d’accès CCI Ivato", categorie: "guide", description: "Plan d’accès et stationnement du CCI Ivato.", dossierId: kit.id, ordre: 3, date: "2026-10-06" }, image("ecran"));

  const mecc = await prisma.dossier.create({
    data: {
      nom: "Agenda MECC Digital",
      ordre: 2,
      auteurNom: "Tahina Rakotondrabe",
      auteurRole: "Responsable partenariats, CanCham",
      auteurBio: "Organise la Mission Économique et Commerciale au Canada depuis 2019 et accompagne les entreprises membres à chaque étape.",
    },
  });
  await prisma.dossier.update({ where: { id: mecc.id }, data: { couverture: await imageDossier(mecc.id, image("reseau"), "couverture.jpg"), auteurPhoto: await imageDossier(mecc.id, image("oratrice"), "auteur.jpg") } });
  const jours = [
    ["Lundi 26 octobre 2026", "Départ de Tana à Montréal", "Aéroport d’Ivato", "Ivato, Antananarivo", "Rendez-vous à 6 h 00", "Départ de la délégation, briefing au comptoir d’enregistrement."],
    ["Mardi 27 octobre 2026", "Arrivée et installation", "Hôtel Le Germain", "2050 Rue Mansfield, Montréal", "Toute la journée", "Installation, remise des badges et briefing d’ouverture de la mission."],
    ["Mercredi 28 octobre 2026", "Assemblée générale annuelle de la CCEM", "Centre Mont-Royal", "2200 Rue Mansfield, Montréal", "De 9 h 00 à 17 h 00", "Assemblée générale et célébrations du 40e anniversaire de la CCEM."],
    ["Vendredi 30 octobre 2026", "Déjeuner industriel chez Belpro Medical", "Belpro Medical", "Laval, Québec", "De 12 h 00 à 14 h 00", "Visite d’usine et déjeuner d’affaires avec les dirigeants."],
    ["Samedi 31 octobre 2026", "Salon international Tourisme et Voyage", "Palais des congrès", "1001 Pl. Jean-Paul-Riopelle, Montréal", "De 10 h 00 à 18 h 00", "Stand Madagascar et rendez-vous avec les voyagistes."],
    ["Vendredi 6 novembre 2026", "Déjeun’aide – Breakfast with Leaders", "The Ritz-Carlton Montréal", "1228 Rue Sherbrooke O, Montréal, QC H3G 1W9", "De 7 h 00 à 9 h 30", "Événement caritatif annuel qui réunit étudiants, jeunes professionnels et grands leaders."],
  ];
  let ordre = 1;
  for (const [jour, titre, lieu, adresse, horaire, description] of jours) {
    await ressourcePage({ titre: jour, categorie: ordre === 1 ? "rapport" : "guide", description: titre, dossierId: mecc.id, ordre: ordre++, date: "2026-10-12" }, jourMecc(jour, titre, lieu, adresse, horaire, description));
  }
  const ateliers = await prisma.dossier.create({ data: { nom: "Ateliers de préparation", parentId: mecc.id, ordre: 1 } });
  await ressourcePdf(
    { titre: "Préparer ses rendez-vous B2B", categorie: "formation", description: "Méthode pour cibler, préparer et suivre ses rendez-vous d’affaires au Canada.", dossierId: ateliers.id, ordre: 1, date: "2026-10-10" },
    [1, 2, 3].map((n) => ({ titre: `Rendez-vous B2B · ${n}/3`, lignes: ["Cibler les bons interlocuteurs", "Préparer une fiche entreprise d’une page", "Relancer sous 48 heures"] })),
  );
  await ressourcePage(
    { titre: "Check-list avant le départ", categorie: "modele", description: "Les documents et réglages à vérifier avant de partir.", dossierId: ateliers.id, ordre: 2, date: "2026-10-11" },
    async () => [
      { id: id(), type: "titre", niveau: 2, texte: "Check-list avant le départ", align: "left" },
      { id: id(), type: "texte", paragraphes: [{ type: "ul", align: "left", items: [[{ t: "Passeport valide 6 mois", b: true }], [{ t: "Autorisation de voyage électronique (AVE)" }], [{ t: "Cartes de visite bilingues" }], [{ t: "Adaptateur électrique type A/B" }]] }] },
    ],
  );

  const etudes = await prisma.dossier.create({ data: { nom: "Études et rapports", ordre: 3 } });
  await prisma.dossier.update({ where: { id: etudes.id }, data: { couverture: await imageDossier(etudes.id, image("formation"), "couverture.jpg") } });
  await ressourcePdf(
    { titre: "Guide export Canada 2027", categorie: "rapport", description: "Marchés porteurs, réglementation, logistique et contacts clés pour exporter de Madagascar vers le Canada.", dossierId: etudes.id, ordre: 1, date: "2026-09-20" },
    ["Sommaire", "Marchés porteurs", "Réglementation", "Logistique", "Financement", "Contacts clés"].map((t, i) => ({ titre: `${i + 1}. ${t}`, lignes: ["Guide export Canada 2027 · Édition membres", `Chapitre ${i + 1} : ${t}.`, "Document réservé : reproduction interdite."] })),
  );
  await ressourcePdf(
    { titre: "Modèle de plan d’affaires export", categorie: "modele", description: "Un modèle prêt à remplir pour présenter votre projet d’export à un partenaire canadien.", dossierId: etudes.id, ordre: 2, date: "2026-09-28" },
    ["Résumé du projet", "Marché cible", "Plan d’action"].map((t) => ({ titre: t, lignes: ["Complétez chaque rubrique.", "Une page par rubrique au maximum."] })),
  );
  await ressourcePage(
    { titre: "Réussir son pitch en 3 minutes", categorie: "formation", description: "Structure, rythme et erreurs à éviter pour convaincre un jury.", dossierId: etudes.id, ordre: 3, date: "2026-10-02" },
    async (rid) => [
      { id: id(), type: "titre", niveau: 2, texte: "Réussir son pitch en 3 minutes", align: "center", couleur: "#12305a" },
      { id: id(), type: "photo", fichier: await photoBloc(rid, image("pitch")), legende: "Finale du défi Pitch MECC 2026." },
      { id: id(), type: "texte", paragraphes: [{ type: "ol", align: "left", items: [[{ t: "Accroche : ", b: true }, { t: "un chiffre ou une histoire en 15 secondes." }], [{ t: "Problème et solution", b: true }], [{ t: "Marché et ambition", b: true }], [{ t: "Demande claire au jury", b: true, couleur: "#d9560c" }]] }] },
    ],
  );

  const comite = await prisma.dossier.create({ data: { nom: "Comité de pilotage", ordre: 4 } });
  const comptesRendus = await prisma.dossier.create({ data: { nom: "Comptes rendus", parentId: comite.id, ordre: 1 } });
  await ressourcePdf(
    { titre: "Compte rendu du 2 octobre 2026", categorie: "rapport", description: "Décisions du comité de pilotage du Gala des 10 ans.", dossierId: comptesRendus.id, ordre: 1, date: "2026-10-02" },
    [{ titre: "Compte rendu du comité", lignes: ["Budget validé.", "Choix du lieu : CCI Ivato.", "Prochaine réunion : 6 novembre 2026."] }],
  );

  await ressourcePdf(
    { titre: "Charte graphique La Traversée", categorie: "modele", description: "Couleurs, typographies et règles d’usage des logos pour vos publications.", dossierId: null, ordre: 1, date: "2026-10-08" },
    [{ titre: "Charte graphique", lignes: ["Bleu nuit #12305A", "Orange #F26B1D", "Montserrat pour les titres, Open Sans pour les textes"] }, { titre: "Logos", lignes: ["Respectez une marge égale à la hauteur du sigle.", "Ne déformez jamais le logo."] }],
  );
  console.log("Bibliothèque de ressources créée.");
}

async function main() {
  await seedComptes();
  await seedEvenements();
  await seedBibliotheque();
  console.log("Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
