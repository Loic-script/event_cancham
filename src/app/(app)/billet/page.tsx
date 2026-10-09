import type { Metadata } from "next";
import { PageTitle } from "@/components/app/PageTitle";
import { QrCode } from "@/components/ticket/QrCode";
import { TicketPhone } from "@/components/ticket/TicketPhone";
import { currentUser, event } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Mon billet" };

export default function TicketPage() {
  const { ticket } = currentUser;

  return (
    <>
      <PageTitle title="Mon billet" subtitle="Présentez ce QR code à l'entrée du gala." />

      <TicketPhone
        code={ticket.code}
        holder={ticket.holder}
        eventName={event.name}
        edition={event.edition}
        clock="18:30"
        qrSmall={<QrCode id="ticket-qr" value={ticket.code} size={200} className="block h-auto w-full" />}
        qrLarge={<QrCode value={ticket.code} size={360} className="block h-auto w-full" />}
      />
    </>
  );
}
