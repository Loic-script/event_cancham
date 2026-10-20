"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enregistrerPromotion, viderPromotion } from "@/app/(app)/galerie/actions";
import { ArrowRightIcon, CameraIcon, PlusIcon } from "@/components/app/icons";
import { DESTINATIONS } from "@/lib/traversee/data";
import { envoyerImage } from "@/lib/traversee/envoi";
import type { Promo } from "@/lib/traversee/galerie";
import { lisImage, toast } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
import { Btn, Card, Champ, FileBtn, Puce, Sur, ui } from "../ui";
import styles from "./accueil.module.css";

const VIDE: Promo = { ann: "", titre: "", texte: "", img: "", lien: DESTINATIONS[0].href };

function PromoForm({ i, promo, onDone }: { i: number; promo: Promo | null; onDone: () => void }) {
  const router = useRouter();
  const [p, setP] = useState<Promo>(promo ?? VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [liberer, setLiberer] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!p.img) return toast("Ajoutez la photo de la promotion.");
    setEnvoi(true);
    try {
      // Une nouvelle photo (réduite dans le navigateur) part d'abord sur le serveur.
      const img = p.img.startsWith("data:") ? await envoyerImage(p.img) : p.img;
      const { error } = await enregistrerPromotion(i, { ...p, img });
      if (error) return toast(error);
      toast(`Emplacement promotion ${i + 1} mis à jour.`);
      router.refresh();
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : "La promotion n’a pas pu être enregistrée.");
    } finally {
      setEnvoi(false);
    }
  }

  async function vider() {
    setEnvoi(true);
    const { error } = await viderPromotion(i);
    setEnvoi(false);
    setLiberer(false);
    if (error) return toast(error);
    toast(`Emplacement promotion ${i + 1} libéré.`);
    router.refresh();
    onDone();
  }

  return (
    <>
      <form onSubmit={(e) => void enregistrer(e)} className={`${ui.card} ${ui.pad} grid gap-3`} style={{ gridColumn: "1 / -1" }}>
        <Sur className="!mb-0">Emplacement {i + 1}</Sur>
        {p.img ? <img src={p.img} alt="" className="h-28 w-full rounded-xl object-cover" /> : null}
        <Champ label="Annonceur" htmlFor={`pr-ann-${i}`}>
          <input id={`pr-ann-${i}`} className={ui.saisie} required maxLength={80} value={p.ann} onChange={(e) => setP({ ...p, ann: e.target.value })} />
        </Champ>
        <Champ label="Titre" htmlFor={`pr-titre-${i}`}>
          <input id={`pr-titre-${i}`} className={ui.saisie} required maxLength={60} value={p.titre} onChange={(e) => setP({ ...p, titre: e.target.value })} />
        </Champ>
        <Champ label="Texte" htmlFor={`pr-texte-${i}`}>
          <input id={`pr-texte-${i}`} className={ui.saisie} maxLength={90} value={p.texte} onChange={(e) => setP({ ...p, texte: e.target.value })} />
        </Champ>
        <Champ label="Lien interne" htmlFor={`pr-lien-${i}`}>
          <select id={`pr-lien-${i}`} className={ui.saisie} value={p.lien} onChange={(e) => setP({ ...p, lien: e.target.value })}>
            {DESTINATIONS.map((d) => (
              <option key={d.href} value={d.href}>
                {d.nom}
              </option>
            ))}
          </select>
        </Champ>
        <FileBtn
          label={
            <>
              <CameraIcon width={16} height={16} />
              {p.img ? "Changer la photo" : "Ajouter la photo"}
            </>
          }
          accept="image/jpeg,image/png,image/webp"
          aria-label="Photo de la promotion"
          onChange={async (e) => {
            const u = await lisImage(e.target.files?.[0], 900);
            e.target.value = "";
            if (u) setP((x) => ({ ...x, img: u }));
            else toast("Cette image n’a pas pu être lue. Choisissez une photo JPEG, PNG ou WebP.");
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" type="submit" disabled={envoi}>
            {envoi ? "Enregistrement…" : "Enregistrer"}
          </Btn>
          <Btn onClick={onDone} disabled={envoi}>
            Annuler
          </Btn>
          {promo ? (
            <Btn className="ml-auto !text-[#b42318]" onClick={() => setLiberer(true)} disabled={envoi}>
              Libérer l’emplacement
            </Btn>
          ) : null}
        </div>
      </form>
      {liberer ? (
        <Confirmer titre={`Libérer l’emplacement ${i + 1} ?`} action="Libérer" enCours={envoi} onConfirmer={() => void vider()} onClose={() => setLiberer(false)}>
          La promotion de {promo?.ann} n’apparaîtra plus sur l’accueil des participants.
        </Confirmer>
      ) : null}
    </>
  );
}

function CartePromo({ p, i, children }: { p: Promo; i: number; children: React.ReactNode }) {
  return (
    <Card className={styles.promo} style={{ "--i": i } as React.CSSProperties}>
      <div className={styles.promoMedia}>
        <img src={p.img} alt="" loading="lazy" />
        <span className={styles.promoNum}>{i + 1}</span>
      </div>
      <div className={styles.promoCorps}>
        <div className="flex flex-wrap gap-1.5">
          <Puce tone="grey" className="!text-[10.5px] !px-2 !py-[3px]">
            {p.ann}
          </Puce>
        </div>
        <h3>{p.titre}</h3>
        <p>{p.texte}</p>
        {children}
      </div>
    </Card>
  );
}

/** Emplacements promotion de l'accueil, remplis par l'équipe depuis le back-office. */
export function Promos({ promos, admin = false }: { promos: (Promo | null)[]; admin?: boolean }) {
  const [edit, setEdit] = useState<number | null>(null);
  const remplies = promos.flatMap((p, i) => (p ? [{ p, i }] : []));

  if (!admin) {
    return (
      <div className={styles.colPromo}>
        <Sur className={`${styles.titre} !mb-0`}>Emplacements promotion</Sur>
        {remplies.length ? (
          remplies.map(({ p, i }, k) => (
            <CartePromo key={i} p={p} i={k}>
              <Btn small href={p.lien} className={`w-full ${styles.promoBtn}`}>
                En savoir plus
                <ArrowRightIcon width={14} height={14} />
              </Btn>
            </CartePromo>
          ))
        ) : (
          <Card pad className="grid gap-2" style={{ gridColumn: "1 / -1" }}>
            <strong className="text-graphite">Faites connaître votre entreprise ici</strong>
            <p className="text-graphite-muted">Les emplacements promotion de l’accueil sont proposés aux partenaires de La Traversée.</p>
            <Btn small href="/messages/equipe" className="w-fit">
              Écrire à l’équipe CanCham
            </Btn>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={styles.colPromo}>
      <Sur className={`${styles.titre} !mb-0`}>Emplacements promotion</Sur>
      {promos.map((p, i) =>
        edit === i ? (
          <PromoForm key={i} i={i} promo={p} onDone={() => setEdit(null)} />
        ) : p ? (
          <CartePromo key={i} p={p} i={i}>
            <Btn small variant="primary" onClick={() => setEdit(i)} className="w-full">
              Modifier
            </Btn>
          </CartePromo>
        ) : (
          <Card key={i} className={`${styles.promo} grid content-between`} style={{ "--i": i } as React.CSSProperties}>
            <div className={`${styles.promoMedia} grid h-[clamp(70px,15vh,128px)] place-items-center bg-[#f3f5f9] text-graphite-faint`}>
              <PlusIcon width={22} height={22} />
              <span className={styles.promoNum}>{i + 1}</span>
            </div>
            <div className={styles.promoCorps}>
              <h3>Emplacement libre</h3>
              <p>Invisible pour les participants tant qu’il est vide.</p>
              <Btn small variant="primary" onClick={() => setEdit(i)} className="w-full">
                Remplir
              </Btn>
            </div>
          </Card>
        ),
      )}
    </div>
  );
}
