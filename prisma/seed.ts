import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
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
  console.log("Seed terminé : événements insérés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
