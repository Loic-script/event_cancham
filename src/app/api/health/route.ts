import { prisma } from "@/lib/prisma";

// GET /api/health — vérifie que la base PostgreSQL répond.
export async function GET() {
  try {
    const [row] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
    return Response.json({ ok: true, database: row.version });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
