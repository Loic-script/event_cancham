import type { Metadata } from "next";
import { MessageCircleIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { ConversationList } from "@/components/messages/ConversationList";
import { listItems } from "@/components/messages/messages-data";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  const items = listItems();

  return (
    <>
      <PageTitle title="Messages" subtitle="Vos échanges avec les participants." />
      <div className="lg:grid lg:h-[calc(100dvh-180px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="lg:border-r lg:border-line lg:p-3">
          <ConversationList items={items} />
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className={`${appStyles.card} flex max-w-xs flex-col items-center gap-3 p-8 text-center`}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-palm-soft text-palm-ink"><MessageCircleIcon width={26} height={26} /></span>
            <p className="font-display text-[1.3rem] text-graphite">Vos messages</p>
            <p className="text-[14px] leading-5 text-graphite-muted">Choisissez une conversation à gauche pour l’ouvrir ici.</p>
          </div>
        </div>
      </div>
    </>
  );
}
