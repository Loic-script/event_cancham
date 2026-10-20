import type { Metadata } from "next";
import { MessageCircleIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { ConversationList } from "@/components/messages/ConversationList";
import { contacts, listeEquipe } from "@/lib/messagerie";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Messagerie · Back-office" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const user = await requireAdmin();
  const [items, personnes] = await Promise.all([listeEquipe(), contacts(user.id)]);
  return (
    <>
      <PageTitle title="Messagerie" subtitle="Les questions envoyées à l’équipe CanCham. Vos réponses partent au nom de l’équipe." />
      <div className="lg:grid lg:h-[calc(100dvh-180px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="lg:border-r lg:border-line lg:p-3">
          <ConversationList items={items} base="/admin/messagerie" contacts={personnes} lienContact="/admin/messagerie/avec" />
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className={`${appStyles.card} flex max-w-xs flex-col items-center gap-3 p-8 text-center`}>
            <span className="text-leaf"><MessageCircleIcon width={48} height={48} /></span>
            <p className="font-display text-[1.3rem] text-graphite">Messages des participants</p>
            <p className="text-[14px] leading-5 text-graphite-muted">Choisissez une conversation à gauche pour y répondre, ou touchez le crayon pour écrire à un participant.</p>
          </div>
        </div>
      </div>
    </>
  );
}
