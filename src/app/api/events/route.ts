import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser, refusSiNonAdmin } from "@/lib/session";

const unauthorized = () => Response.json({ error: "Connexion requise." }, { status: 401 });

async function autorise() {
  const user = await getCurrentUser();
  return !!user && aAccesEspace(user);
}

export async function GET() {
  if (!(await autorise())) return unauthorized();

  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  return Response.json(events);
}

/** Création réservée aux administrateurs (route technique d'origine, sans écran dans le back-office). */
export async function POST(request: Request) {
  const refus = await refusSiNonAdmin();
  if (refus) return refus;

  const body = await request.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.startsAt) {
    return Response.json(
      { error: "Champs requis : title (string) et startsAt (date ISO)." },
      { status: 400 },
    );
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  return Response.json(event, { status: 201 });
}
