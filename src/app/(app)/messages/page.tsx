import type { Metadata } from "next";
import { MessageCircleIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { ConversationList } from "@/components/messages/ConversationList";
import { contacts, listeConversations } from "@/lib/messagerie";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireMembreActif();
  const [items, personnes] = await Promise.all([listeConversations(user.id), contacts(user.id)]);

  return (
    <>
      <PageTitle title="Messages" subtitle="Vos échanges avec les participants et l’équipe CanCham." />
      <div className="lg:grid lg:h-[calc(100dvh-180px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="lg:border-r lg:border-line lg:p-3">
          <ConversationList items={items} contacts={personnes} lienContact="/messages/avec" equipeHref={user.acces === "ADMIN" ? undefined : "/messages/equipe"} />
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className={`${appStyles.card} flex max-w-xs flex-col items-center gap-3 p-8 text-center`}>
            <span className="text-leaf"><MessageCircleIcon width={48} height={48} /></span>
            <p className="font-display text-[1.3rem] text-graphite">Vos messages</p>
            <p className="text-[14px] leading-5 text-graphite-muted">Choisissez une conversation à gauche, ou touchez le crayon pour écrire à quelqu’un.</p>
          </div>
        </div>
      </div>
    </>
  );
}
