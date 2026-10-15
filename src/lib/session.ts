import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SESSION_DAYS = 30;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  acces: true,
  company: true,
  sector: true,
  bio: true,
  phone: true,
  website: true,
  city: true,
  country: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SessionUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { expiresAt: true, user: { select: userSelect } },
    });
    if (!session || session.expiresAt <= new Date()) return null;
    return session.user;
  } catch (error) {
    console.error("Lecture de la session impossible :", error);
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

export async function estAdmin(): Promise<boolean> {
  return (await getCurrentUser())?.acces === "ADMIN";
}

export async function refusSiNonAdmin(): Promise<Response | null> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, message: "Connexion requise." }, { status: 401 });
  if (user.acces !== "ADMIN") return Response.json({ ok: false, message: "Action réservée aux administrateurs." }, { status: 403 });
  return null;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.acces !== "ADMIN") redirect("/");
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    } catch (error) {
      console.error("Suppression de la session impossible :", error);
    }
  }
  store.delete(SESSION_COOKIE);
}
