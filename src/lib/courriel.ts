import nodemailer from "nodemailer";

export type Courriel = { a: string; sujet: string; texte: string; html: string };

/** SMTP_HOST suffit pour envoyer (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE et MAIL_FROM sont facultatifs). */
export function courrielConfigure(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

/** En développement sans SMTP, le message est écrit dans le terminal du serveur au lieu d'être envoyé. */
export function courrielDisponible(): boolean {
  return courrielConfigure() || process.env.NODE_ENV !== "production";
}

export async function envoyerCourriel({ a, sujet, texte, html }: Courriel): Promise<void> {
  if (!courrielConfigure()) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP non configuré (SMTP_HOST manquant)");
    console.info(`\n[Courriel non envoyé : SMTP non configuré]\nÀ : ${a}\nSujet : ${sujet}\n\n${texte}\n`);
    return;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || (user ? `La Traversée <${user}>` : "La Traversée <no-reply@cancham.mg>"),
    to: a,
    subject: sujet,
    text: texte,
    html,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
