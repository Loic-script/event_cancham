import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { Thread } from "@/components/messages/Thread";
import { accesConversation, auteurEstMoi, contacts, interlocuteurDe, listeEquipe, luParLAutre, marquerLu, messagesDe } from "@/lib/messagerie";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Messagerie · Back-office" };
export const dynamic = "force-dynamic";

export default async function AdminConversationPage(props: PageProps<"/admin/messagerie/[id]">) {
  const { id } = await props.params;
  const user = await requireAdmin();
  const c = await accesConversation(id, user, "equipe");
  if (!c) notFound();

  await marquerLu(c, user, "equipe");
  const [messages, items, personnes] = await Promise.all([messagesDe(c.id, auteurEstMoi(c, user, "equipe")), listeEquipe(), contacts(user.id)]);

  return (
    <div className="lg:px-10 lg:py-10">
      <div className="lg:grid lg:h-[calc(100dvh-80px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="hidden lg:block lg:border-r lg:border-line lg:p-3">
          <ConversationList items={items} activeId={id} base="/admin/messagerie" contacts={personnes} lienContact="/admin/messagerie/avec" />
        </div>
        <Thread key={id} conversationId={c.id} cote="equipe" peer={interlocuteurDe(c, user, "equipe")} initial={messages} vuJusqua={luParLAutre(c, user, "equipe")?.toISOString() ?? null} backHref="/admin/messagerie" />
      </div>
    </div>
  );
}
