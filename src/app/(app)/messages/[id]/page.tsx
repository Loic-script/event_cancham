import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { Thread } from "@/components/messages/Thread";
import { accesConversation, auteurEstMoi, contacts, interlocuteurDe, listeConversations, luParLAutre, marquerLu, messagesDe } from "@/lib/messagerie";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ConversationPage(props: PageProps<"/messages/[id]">) {
  const { id } = await props.params;
  const user = await requireMembreActif();
  const c = await accesConversation(id, user, "membre");
  if (!c) notFound();

  // Ouvrir la conversation la marque comme lue (avant de calculer les pastilles de la liste).
  await marquerLu(c, user, "membre");
  const [messages, items, personnes] = await Promise.all([messagesDe(c.id, auteurEstMoi(c, user, "membre")), listeConversations(user.id), contacts(user.id)]);

  return (
    <div className="lg:px-10 lg:py-10">
      <div className="lg:grid lg:h-[calc(100dvh-80px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="hidden lg:block lg:border-r lg:border-line lg:p-3">
          <ConversationList items={items} activeId={id} contacts={personnes} lienContact="/messages/avec" equipeHref={user.acces === "ADMIN" ? undefined : "/messages/equipe"} />
        </div>
        <Thread key={id} conversationId={c.id} cote="membre" peer={interlocuteurDe(c, user, "membre")} initial={messages} vuJusqua={luParLAutre(c, user, "membre")?.toISOString() ?? null} />
      </div>
    </div>
  );
}
