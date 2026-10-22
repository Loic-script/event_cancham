import type { Metadata } from "next";
import { PageTitle } from "@/components/app/PageTitle";
import { QrCode } from "@/components/ticket/QrCode";
import { TicketPhone } from "@/components/ticket/TicketPhone";
import { event } from "@/lib/evenement";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Mon billet" };

export default async function TicketPage() {
  const user = await requireMembreActif();
  const titulaire = `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      <PageTitle title="Mon billet" subtitle={user.billetPaye ? "Présentez ce QR code à l'entrée du gala." : "Présentez ce QR code à l'entrée du gala. Votre billet n'est pas encore réglé : le paiement vous sera demandé à l'entrée."} />

      <TicketPhone
        code={user.codeBillet}
        holder={titulaire}
        eventName={event.name}
        edition={event.edition}
        clock="18:30"
        qrSmall={<QrCode id="ticket-qr" value={user.codeBillet} size={200} className="block h-auto w-full" />}
        qrLarge={<QrCode value={user.codeBillet} size={360} className="block h-auto w-full" />}
      />
    </>
  );
}
