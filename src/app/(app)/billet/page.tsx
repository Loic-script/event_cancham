import type { Metadata } from "next";
import { CalendarIcon, CheckIcon, ClockIcon, InfoIcon, MapPinIcon, WalletIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { QrCode } from "@/components/ticket/QrCode";
import { TicketStub } from "@/components/ticket/TicketStub";
import styles from "@/components/ticket/ticket.module.css";
import { formatLongDate } from "@/lib/format";
import { currentUser, event } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Mon billet" };

export default function TicketPage() {
  const { ticket } = currentUser;

  return (
    <>
      <PageTitle title="Mon billet" subtitle="Présentez ce QR code à l'entrée du gala." />

      <div className="mx-auto grid max-w-md gap-6 lg:max-w-4xl lg:grid-cols-[400px_1fr] lg:items-start lg:gap-10">
        {/* ---------- le billet ---------- */}
        <article className={`${styles.ticket} theme-light`} aria-label="Billet d'entrée">
          <div className={styles.head}>
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">{event.organizer}</p>
                <p className="mt-1 font-display text-[2rem] leading-none">{event.name}</p>
                <p className="mt-1 text-[14px] text-white/85">{event.edition}</p>
              </div>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-[1.6rem] italic text-gold-soft ring-1 ring-white/25">
                10
              </span>
            </div>
            <div className="relative z-10 mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Titulaire</p>
                <p className="mt-0.5 text-[17px] font-semibold">{ticket.holder}</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/25">{ticket.type}</span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 py-5">
            <div>
              <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-faint"><CalendarIcon width={13} height={13} />Date</dt>
              <dd className="mt-1 text-[14px] font-semibold text-graphite">{event.dateLabel}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-faint"><ClockIcon width={13} height={13} />Heure</dt>
              <dd className="mt-1 text-[14px] font-semibold text-graphite">{event.timeLabel}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-faint"><MapPinIcon width={13} height={13} />Lieu</dt>
              <dd className="mt-1 text-[14px] font-semibold text-graphite">{event.venue}, {event.city}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-faint">Table</dt>
              <dd className="mt-1 font-display text-[1.6rem] leading-none text-graphite">{ticket.table}</dd>
            </div>
          </dl>

          <div className={styles.perf} aria-hidden />

          <TicketStub
            code={ticket.code}
            holder={ticket.holder}
            qrSmall={<QrCode id="ticket-qr" value={ticket.code} size={200} className="block h-auto w-[200px]" />}
            qrLarge={<QrCode value={ticket.code} size={360} className="block h-auto w-full" />}
          />

          <div className={styles.shine} aria-hidden />
        </article>

        {/* ---------- informations ---------- */}
        <div className="flex flex-col gap-4">
          <section className={`${appStyles.card} p-4`}>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-graphite"><InfoIcon width={18} height={18} className="text-palm-ink" />À l’entrée</h2>
            <ul className="flex flex-col gap-2.5 text-[14px] leading-5 text-graphite-muted">
              <li className="flex gap-2"><CheckIcon width={18} height={18} className="shrink-0 text-palm-ink" />Le QR code est scanné une seule fois, gardez-le pour vous.</li>
              <li className="flex gap-2"><CheckIcon width={18} height={18} className="shrink-0 text-palm-ink" />Le mode plein écran et la luminosité au maximum accélèrent le passage.</li>
              <li className="flex gap-2"><CheckIcon width={18} height={18} className="shrink-0 text-palm-ink" />{event.dressCode}. Le vestiaire est à droite de l’accueil.</li>
            </ul>
          </section>

          <button
            type="button"
            disabled
            className={`${appStyles.card} flex cursor-not-allowed items-center gap-3 p-4 text-left opacity-70`}
            aria-describedby="wallet-hint"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-graphite-muted"><WalletIcon width={20} height={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-graphite">Ajouter au portefeuille du téléphone</span>
              <span id="wallet-hint" className="block text-[12px] text-graphite-muted">Apple Wallet et Google Wallet, bientôt disponible.</span>
            </span>
          </button>

          <p className="text-[12px] text-graphite-faint">Billet émis le {formatLongDate(ticket.issuedAt)}.</p>
        </div>
      </div>
    </>
  );
}
