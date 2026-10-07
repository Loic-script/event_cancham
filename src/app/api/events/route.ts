import { prisma } from "@/lib/prisma";

// GET /api/events — liste des événements, du plus proche au plus lointain.
export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  return Response.json(events);
}

// POST /api/events — crée un événement.
// Corps JSON attendu : { title, startsAt, description?, location?, endsAt? }
export async function POST(request: Request) {
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
