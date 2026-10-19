import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

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

export async function POST(request: Request) {
  if (!(await autorise())) return unauthorized();

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
