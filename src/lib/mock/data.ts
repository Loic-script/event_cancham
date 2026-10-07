// Données de démonstration de l'espace participant.
// Elles reproduisent la forme des futurs modèles Prisma (User, Ticket, Post,
// Conversation, Message) pour que le branchement sur la base soit un simple
// remplacement de ce module.

export type Country = "MG" | "CA";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  city: string;
  country: Country;
  sector: string;
  bio?: string;
  online?: boolean;
  /** Teinte (0-360) qui colore l'avatar en l'absence de photo. */
  hue: number;
};

export type Ticket = {
  code: string;
  type: string;
  table: string;
  holder: string;
  issuedAt: string;
  status: "valid" | "used" | "cancelled";
};

export type PostTag = "gala" | "défi" | "réseau";

export type Post = {
  id: string;
  authorId: string;
  minutesAgo: number;
  text: string;
  likes: number;
  comments: number;
  liked: boolean;
  tag?: PostTag;
  challenge?: string;
};

export type Message = {
  id: string;
  fromMe: boolean;
  text: string;
  minutesAgo: number;
  seen?: boolean;
};

export type Conversation = {
  id: string;
  participantId: string;
  unread: number;
  messages: Message[];
};

export const event = {
  name: "La Traversée",
  edition: "Gala des 10 ans",
  organizer: "CanCham Madagascar",
  date: "2026-12-18T18:30:00+03:00",
  dateLabel: "Vendredi 18 décembre 2026",
  timeLabel: "18 h 30",
  venue: "CCI Ivato",
  city: "Antananarivo",
  dressCode: "Tenue de soirée",
};

export const currentUser: Person & { email: string; ticket: Ticket; linkedin?: string; website?: string; memberSince: string } = {
  id: "me",
  firstName: "Faneva",
  lastName: "Loïc",
  role: "Fondateur",
  company: "Event Studio",
  city: "Antananarivo",
  country: "MG",
  sector: "Événementiel",
  bio: "J'organise des rencontres entre entrepreneurs malgaches et canadiens. Toujours partant pour un café et un défi.",
  hue: 152,
  email: "faneva@loic",
  linkedin: "linkedin.com/in/faneva-loic",
  memberSince: "2026-06-20",
  ticket: {
    code: "TRV26-GALA-0427",
    type: "Gala des 10 ans · Soirée",
    table: "12",
    holder: "Faneva Loïc",
    issuedAt: "2026-10-02T09:14:00+03:00",
    status: "valid",
  },
};

export const participants: Person[] = [
  { id: "p1", firstName: "Miora", lastName: "Andriamanjato", role: "Directrice générale", company: "Sahanala Export", city: "Antananarivo", country: "MG", sector: "Agroalimentaire", bio: "Vanille, girofle et cacao vers le Canada depuis 2014.", online: true, hue: 18 },
  { id: "p2", firstName: "Tahina", lastName: "Rakotondrabe", role: "Responsable partenariats", company: "CanCham Madagascar", city: "Antananarivo", country: "MG", sector: "Services", bio: "Organisatrice de La Traversée. Posez-moi vos questions sur la soirée.", online: true, hue: 340 },
  { id: "p3", firstName: "Julie", lastName: "Tremblay", role: "Conseillère commerciale", company: "Délégation du Québec", city: "Montréal", country: "CA", sector: "Institutionnel", bio: "Accompagne les entreprises québécoises dans l'océan Indien.", online: false, hue: 205 },
  { id: "p4", firstName: "Marc-André", lastName: "Gagnon", role: "Fondateur", company: "Nordik Minerals", city: "Québec", country: "CA", sector: "Mines", online: true, hue: 262 },
  { id: "p5", firstName: "Hery", lastName: "Razafindrakoto", role: "CEO", company: "Tsiky Tech", city: "Antananarivo", country: "MG", sector: "Numérique", bio: "Nous développons des applications pour la diaspora.", online: true, hue: 120 },
  { id: "p6", firstName: "Sophie", lastName: "Lavoie", role: "Directrice export", company: "Maple Foods", city: "Toronto", country: "CA", sector: "Agroalimentaire", online: false, hue: 28 },
  { id: "p7", firstName: "Lalaina", lastName: "Ramanantsoa", role: "Artisane créatrice", company: "Zafy Design", city: "Antsirabe", country: "MG", sector: "Artisanat", online: false, hue: 300 },
  { id: "p8", firstName: "David", lastName: "Nguyen", role: "Investisseur", company: "Saint-Laurent Capital", city: "Montréal", country: "CA", sector: "Finance", online: true, hue: 190 },
  { id: "p9", firstName: "Nirina", lastName: "Rabemananjara", role: "Responsable RSE", company: "Ambatovy", city: "Toamasina", country: "MG", sector: "Industrie", online: false, hue: 80 },
  { id: "p10", firstName: "Camille", lastName: "Roy", role: "Journaliste", company: "Les Affaires", city: "Montréal", country: "CA", sector: "Médias", online: true, hue: 350 },
];

export const posts: Post[] = [
  { id: "post0", authorId: "me", minutesAgo: 5, tag: "défi", challenge: "Défi 1 · « J'y serai »", text: "Ma photo « J'y serai » est en ligne sur Facebook. Un petit cœur si vous passez par là, le gala approche !", likes: 12, comments: 2, liked: false },
  { id: "post1", authorId: "p2", minutesAgo: 8, tag: "gala", text: "Les portes du gala ouvrent à 18 h 30. Pensez à augmenter la luminosité de votre écran avant de présenter votre billet à l'entrée, ça va beaucoup plus vite !", likes: 42, comments: 6, liked: false },
  { id: "post2", authorId: "p5", minutesAgo: 23, tag: "défi", challenge: "Défi 1 · « J'y serai »", text: "Photo publiée, réseau mobilisé : 240 réactions en une heure. Qui fait mieux avant le 18 décembre ?", likes: 31, comments: 4, liked: true },
  { id: "post3", authorId: "p1", minutesAgo: 47, tag: "réseau", text: "Quelqu'un d'autre dans l'agroalimentaire ce soir ? Je cherche un distributeur au Québec pour notre vanille bourbon. Table 7, venez me voir.", likes: 18, comments: 9, liked: false },
  { id: "post4", authorId: "p3", minutesAgo: 95, tag: "gala", text: "Dix ans de La Traversée, et toujours la même énergie. Bravo à toute l'équipe de CanCham pour cette décennie de ponts entre Madagascar et le Canada.", likes: 64, comments: 11, liked: false },
  { id: "post5", authorId: "p7", minutesAgo: 140, tag: "défi", challenge: "Défi 2 · Pitch MECC", text: "Vidéo de pitch déposée ! Deux minutes pour raconter Zafy Design, c'était court mais intense. Croisons les doigts pour la présélection.", likes: 27, comments: 3, liked: false },
  { id: "post6", authorId: "p8", minutesAgo: 210, tag: "réseau", text: "Pitch MECC à 20 h : j'y serai au premier rang. Les fondateurs qui veulent un retour franc sur leur deck, écrivez-moi.", likes: 22, comments: 5, liked: false },
  { id: "post7", authorId: "p10", minutesAgo: 300, tag: "gala", text: "Je prépare un reportage sur les entrepreneures malgaches présentes ce soir. Si vous voulez témoigner, je suis près de la scène.", likes: 15, comments: 2, liked: false },
  { id: "post8", authorId: "me", minutesAgo: 1500, tag: "gala", text: "Billet reçu, table 12 réservée. Rendez-vous le 18 décembre pour fêter les dix ans de La Traversée !", likes: 9, comments: 1, liked: false },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    participantId: "p2",
    unread: 2,
    messages: [
      { id: "m1", fromMe: false, text: "Bonsoir Faneva ! Bienvenue à La Traversée.", minutesAgo: 60 },
      { id: "m2", fromMe: true, text: "Merci Tahina, ravi d'être là. Où se trouve ma table ?", minutesAgo: 55, seen: true },
      { id: "m3", fromMe: false, text: "Table 12, côté jardin, juste à gauche de la scène.", minutesAgo: 50 },
      { id: "m4", fromMe: false, text: "Et n'oubliez pas : le premier défi se joue avant le dîner 😉", minutesAgo: 4 },
      { id: "m5", fromMe: false, text: "Votre billet est bien validé, vous pouvez passer par l'entrée VIP.", minutesAgo: 3 },
    ],
  },
  {
    id: "c2",
    participantId: "p3",
    unread: 0,
    messages: [
      { id: "m6", fromMe: true, text: "Bonjour Julie, je serais ravi d'échanger sur le marché québécois pour l'événementiel.", minutesAgo: 190, seen: true },
      { id: "m7", fromMe: false, text: "Avec plaisir ! Retrouvons-nous au cocktail, près du bar à vanille.", minutesAgo: 180 },
      { id: "m8", fromMe: true, text: "Parfait, à tout à l'heure.", minutesAgo: 175, seen: true },
    ],
  },
  {
    id: "c3",
    participantId: "p5",
    unread: 1,
    messages: [
      { id: "m9", fromMe: false, text: "Tu as vu le défi « J'y serai » ? On se tague mutuellement pour les réactions ?", minutesAgo: 30 },
    ],
  },
  {
    id: "c4",
    participantId: "p1",
    unread: 0,
    messages: [
      { id: "m10", fromMe: false, text: "Merci pour la mise en relation avec Sophie, on se voit demain matin.", minutesAgo: 400 },
      { id: "m11", fromMe: true, text: "Super nouvelle. Bonne discussion !", minutesAgo: 395, seen: true },
    ],
  },
  {
    id: "c5",
    participantId: "p4",
    unread: 0,
    messages: [
      { id: "m12", fromMe: true, text: "Bienvenue à Madagascar Marc-André. Premier séjour ?", minutesAgo: 1500, seen: true },
      { id: "m13", fromMe: false, text: "Premier séjour, et déjà conquis. On se croise ce soir ?", minutesAgo: 1440 },
    ],
  },
  {
    id: "c6",
    participantId: "p6",
    unread: 0,
    messages: [
      { id: "m14", fromMe: false, text: "Hello! Looking forward to meeting you at the gala.", minutesAgo: 2900 },
    ],
  },
];

export function fullName(p: Pick<Person, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`;
}

export function initials(p: Pick<Person, "firstName" | "lastName">) {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

export function personById(id: string): Person {
  if (id === currentUser.id) return currentUser;
  const found = participants.find((p) => p.id === id);
  if (!found) throw new Error(`Participant inconnu : ${id}`);
  return found;
}

export function conversationById(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function unreadTotal() {
  return conversations.reduce((sum, c) => sum + c.unread, 0);
}

export const countryLabel: Record<Country, string> = { MG: "Madagascar", CA: "Canada" };
