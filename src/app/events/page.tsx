import { prisma } from "@/lib/prisma";
import type { Event } from "@/generated/prisma/client";

// Page serveur : interroge PostgreSQL directement via Prisma (aucun code DB
// n'est envoyé au navigateur). Rendue à chaque requête.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
});

async function loadEvents(): Promise<
  { ok: true; events: Event[] } | { ok: false; error: string }
> {
  try {
    const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
    return { ok: true, events };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export default async function Home() {
  const result = await loadEvents();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Événements</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Next.js 16 + Prisma + PostgreSQL 17
        </p>
      </header>

      {!result.ok ? (
        <section className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Connexion à PostgreSQL impossible.</p>
          <p className="mt-1">
            Vérifiez <code>DATABASE_URL</code> dans <code>.env</code>, puis lancez{" "}
            <code>npm run db:migrate</code>.
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs opacity-80">
            {result.error}
          </pre>
        </section>
      ) : result.events.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Aucun événement. Lancez <code>npm run db:seed</code> ou envoyez un POST
          sur <code>/api/events</code>.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h2 className="text-lg font-medium">{event.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {dateFormat.format(event.startsAt)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
              {event.description ? (
                <p className="mt-2 text-sm">{event.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
