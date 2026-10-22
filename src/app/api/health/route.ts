import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Sonde de l'hébergeur : répond « ok » si la base répond, sans rien dévoiler de l'installation. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
