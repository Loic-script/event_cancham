import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "faneva.loic@event-studio.mg";
const DEMO_PASSWORD = "LaTraversee2026!";

const TEST_ACCOUNTS = [
  { email: "membre@gmail.com", password: "12345678", firstName: "Membre", lastName: "Test", acces: "MEMBRE" },
  { email: "admin@gmail.com", password: "12345678", firstName: "Admin", lastName: "CanCham", acces: "ADMIN" },
] as const;

async function main() {
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
      city: "Antananarivo",
      country: "MG",
    },
  });

  for (const account of TEST_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, acces: account.acces },
      create: {
        email: account.email,
        passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        acces: account.acces,
      },
    });
  }

  if ((await prisma.event.count()) > 0) {
    console.log(`Seed terminé : comptes de démonstration et de test à jour (${TEST_ACCOUNTS.map((a) => a.email).join(", ")}), événements déjà présents.`);
    return;
  }

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
  console.log(`Seed terminé : événements insérés, compte de démonstration ${DEMO_EMAIL} (mot de passe : ${DEMO_PASSWORD}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
