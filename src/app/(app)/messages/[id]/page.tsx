import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { listItems, threadData } from "@/components/messages/messages-data";
import { Thread } from "@/components/messages/Thread";

export async function generateMetadata(props: PageProps<"/messages/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const data = threadData(id);
  return { title: data ? data.peer.name : "Messages" };
}

export default async function ConversationPage(props: PageProps<"/messages/[id]">) {
  const { id } = await props.params;
  const data = threadData(id);
  if (!data) notFound();

  return (
    <div className="lg:px-10 lg:py-10">
      <div className="lg:grid lg:h-[calc(100dvh-80px)] lg:grid-cols-[360px_1fr] lg:overflow-hidden lg:rounded-[18px] lg:border lg:border-line lg:bg-surface">
        <div className="hidden lg:block lg:border-r lg:border-line lg:p-3">
          <ConversationList items={listItems()} activeId={id} />
        </div>
        <Thread key={id} peer={data.peer} initial={data.messages} />
      </div>
    </div>
  );
}
