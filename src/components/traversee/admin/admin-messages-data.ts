import type { ConversationItem } from "@/components/messages/ConversationList";
import type { ThreadMessage } from "@/components/messages/Thread";
import { clockFromMinutes, shortFromMinutes } from "@/lib/format";
import { conversations, currentUser, fullName } from "@/lib/mock/data";

type AdminConv = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  hue: number;
  online?: boolean;
  unread: number;
  messages: { id: string; fromMe: boolean; text: string; minutesAgo: number; seen?: boolean }[];
};

function liee(): AdminConv {
  const c = conversations.find((x) => x.id === "c1");
  return {
    id: "participant",
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    company: currentUser.company,
    role: currentUser.role,
    hue: currentUser.hue,
    online: true,
    unread: 1,
    messages: (c?.messages ?? []).map((m) => ({ id: m.id, fromMe: !m.fromMe, text: m.text, minutesAgo: m.minutesAgo, seen: m.seen })),
  };
}

const AUTRES: AdminConv[] = [
  {
    id: "hery",
    firstName: "Hery",
    lastName: "Rabe",
    company: "Baobab Conseil",
    role: "Responsable export",
    hue: 210,
    online: true,
    unread: 1,
    messages: [{ id: "a1", fromMe: false, text: "Bonjour, où puis-je retirer mon badge le 18 ?", minutesAgo: 35 }],
  },
  {
    id: "miora",
    firstName: "Miora",
    lastName: "Rajao",
    company: "Hauts Plateaux Textile",
    role: "Directrice générale",
    hue: 300,
    unread: 0,
    messages: [
      { id: "b1", fromMe: false, text: "Peut-on changer de table après avoir réservé ?", minutesAgo: 1500 },
      { id: "b2", fromMe: true, text: "Oui, depuis l’onglet Ma place : libérez votre chaise puis choisissez-en une autre.", minutesAgo: 1480, seen: true },
    ],
  },
  {
    id: "tojo",
    firstName: "Tojo",
    lastName: "Andria",
    company: "Tsara Logistique",
    role: "Gérant",
    hue: 40,
    unread: 0,
    messages: [{ id: "c1", fromMe: false, text: "Merci pour la confirmation de ma place, à bientôt !", minutesAgo: 2900 }],
  },
];

export function adminConversations(): AdminConv[] {
  return [liee(), ...AUTRES];
}

export function adminListItems(): ConversationItem[] {
  return adminConversations()
    .map((c) => {
      const last = c.messages[c.messages.length - 1];
      return {
        item: {
          id: c.id,
          name: fullName(c),
          firstName: c.firstName,
          lastName: c.lastName,
          hue: c.hue,
          online: c.online,
          company: c.company,
          lastText: last?.text ?? "Nouvelle conversation",
          lastFromMe: last?.fromMe ?? false,
          lastWhen: last ? shortFromMinutes(last.minutesAgo) : "",
          unread: c.unread,
        } satisfies ConversationItem,
        recency: last?.minutesAgo ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.recency - b.recency)
    .map((x) => x.item);
}

export function adminThreadData(id: string) {
  const c = adminConversations().find((x) => x.id === id);
  if (!c) return null;
  const messages: ThreadMessage[] = c.messages.map((m) => ({ id: m.id, fromMe: m.fromMe, text: m.text, time: clockFromMinutes(m.minutesAgo), seen: m.seen }));
  return { peer: { firstName: c.firstName, lastName: c.lastName, name: fullName(c), hue: c.hue, online: c.online, role: c.role, company: c.company }, messages };
}
