import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { Thread } from "@/components/messages/Thread";
import { adminListItems, adminThreadData } from "@/components/traversee/admin/admin-messages-data";

export async function generateMetadata(props: PageProps<"/admin/messagerie/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const data = adminThreadData(id);
  return { title: data ? `${data.peer.name} · Back-office` : "Messagerie · Back-office" };
}

export default async function AdminConversationPage(props: PageProps<"/admin/messagerie/[id]">) {
  const { id } = await props.params;
  const data = adminThreadData(id);
  if (!data) notFound();

  return (
    <div className="lg:px-10 lg:py-10">
      <div className="lg:grid lg:h-[calc(100dvh-80px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="hidden lg:block lg:border-r lg:border-line lg:p-3">
          <ConversationList items={adminListItems()} activeId={id} base="/admin/messagerie" />
        </div>
        <Thread key={id} peer={data.peer} initial={data.messages} backHref="/admin/messagerie" />
      </div>
    </div>
  );
}
