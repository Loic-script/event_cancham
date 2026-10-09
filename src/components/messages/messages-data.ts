import { clockFromMinutes, shortFromMinutes } from "@/lib/format";
import { conversations, fullName, personById } from "@/lib/mock/data";
import type { ConversationItem } from "./ConversationList";
import type { ThreadMessage } from "./Thread";

export function listItems(): ConversationItem[] {
  return conversations
    .map((c) => {
      const p = personById(c.participantId);
      const last = c.messages[c.messages.length - 1];
      const item: ConversationItem = {
        id: c.id,
        name: fullName(p),
        firstName: p.firstName,
        lastName: p.lastName,
        hue: p.hue,
        online: p.online,
        company: p.company,
        lastText: last.text,
        lastFromMe: last.fromMe,
        lastWhen: shortFromMinutes(last.minutesAgo),
        unread: c.unread,
      };
      return { item, recency: last.minutesAgo };
    })
    .sort((a, b) => a.recency - b.recency)
    .map((x) => x.item);
}

export function threadData(id: string) {
  const c = conversations.find((conv) => conv.id === id);
  if (!c) return null;
  const p = personById(c.participantId);
  const messages: ThreadMessage[] = c.messages.map((m) => ({
    id: m.id,
    fromMe: m.fromMe,
    text: m.text,
    time: clockFromMinutes(m.minutesAgo),
    seen: m.seen,
  }));
  return {
    peer: { firstName: p.firstName, lastName: p.lastName, name: fullName(p), hue: p.hue, online: p.online, role: p.role, company: p.company },
    messages,
  };
}
