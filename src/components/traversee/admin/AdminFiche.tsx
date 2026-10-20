"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { modifierAdmin, retirerAdmin, supprimerAdmin } from "@/app/(app)/admin/administrateurs/actions";
import { BriefcaseIcon, CalendarIcon, CheckIcon, ClockIcon, MailIcon, PencilIcon, PhoneIcon, ShieldCheckIcon, TrashIcon, XIcon } from "@/components/app/icons";
import { IMG } from "@/lib/traversee/data";
import { toast } from "@/lib/traversee/store";
import { Ligne } from "../annuaire/ParticipantModal";
import styles from "../annuaire/annuaire.module.css";
import { Modal } from "../Modal";
import { AvatarProfil, Btn, Champ, Note, Puce, Sur, ui } from "../ui";

export type AdminVue = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  nom: string;
  role: string;
  company: string;
  phone: string;
  photo: string | null;
  creeLe: string;
  adminDepuis: string;
  derniereConnexion: string | null;
  superAdmin: boolean;
};

// Heure de Madagascar : le serveur et le navigateur affichent la même date.
const FUSEAU = "Indian/Antananarivo";
const JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSEAU });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });
export const dateLongue = (iso: string) => JOUR.format(new Date(iso));
export const dateHeure = (iso: string) => `${JOUR.format(new Date(iso))} à ${HEURE.format(new Date(iso)).replace(":", " h ")}`;

type Mode = "vue" | "edition" | "retirer" | "supprimer";

/** Fenêtre « À propos » d'un administrateur ; le super admin peut le modifier, lui retirer ses droits ou supprimer son compte. */
export function AdminFiche({ admin, moi, peutGerer, onClose }: { admin: AdminVue; moi: boolean; peutGerer: boolean; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("vue");
  const [envoi, setEnvoi] = useState(false);
  const [f, setF] = useState({ firstName: admin.firstName, lastName: admin.lastName, email: admin.email, phone: admin.phone, company: admin.company, role: admin.role });
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    const { error } = await modifierAdmin(admin.id, f);
    setEnvoi(false);
    if (error) return toast(error);
    toast(f.email.trim().toLowerCase() !== admin.email ? `Enregistré. Prévenez ${f.firstName.trim()} : son identifiant de connexion devient ${f.email.trim().toLowerCase()}.` : "Informations enregistrées.");
    setMode("vue");
    router.refresh();
  }

  async function confirmer() {
    setEnvoi(true);
    const { error } = mode === "retirer" ? await retirerAdmin(admin.id) : await supprimerAdmin(admin.id);
    setEnvoi(false);
    if (error) return toast(error);
    toast(mode === "retirer" ? `${admin.nom} n’est plus administrateur et redevient membre.` : `Le compte de ${admin.nom} a été supprimé.`);
    onClose();
    router.refresh();
  }

  const sousTitre = [admin.role, admin.company].filter(Boolean).join(" · ") || admin.email;

  return (
    <Modal onClose={onClose} label={`Administrateur : ${admin.nom}`} className={styles.pBoite}>
      <header className={styles.pBandeau} style={{ backgroundImage: `linear-gradient(160deg, rgba(10,22,38,.92) 0%, rgba(18,48,90,.72) 55%, rgba(242,107,29,.35) 100%), url(${IMG("equipe")})` }}>
        <button type="button" onClick={onClose} aria-label="Fermer" className={styles.pFermer}>
          <XIcon width={18} height={18} />
        </button>
        <Sur className="!mb-0 !text-white/70">{mode === "edition" ? "Modifier l’administrateur" : "Administrateur"}</Sur>
        <div className={styles.pTete}>
          <AvatarProfil photo={admin.photo} size={60} className={styles.pLg} />
          <div className="min-w-0">
            <h3>{admin.nom}</h3>
            <p>{sousTitre}</p>
          </div>
        </div>
        <div className={styles.pPuces}>
          {admin.superAdmin ? <Puce tone="red">Super admin</Puce> : <Puce tone="white">Administrateur</Puce>}
          {moi ? <Puce tone="grey">Vous</Puce> : null}
          <Puce tone="grey">Admin depuis le {dateLongue(admin.adminDepuis)}</Puce>
        </div>
      </header>

      {mode === "edition" ? (
        <form id="admin-fiche-form" onSubmit={enregistrer} className={`${styles.pCorps} ${ui.stagger}`}>
          <section className={styles.pBloc}>
            <Sur>Identité</Sur>
            <div className={ui.g2}>
              <Champ label="Prénom" htmlFor="af-prenom">
                <input id="af-prenom" className={ui.saisie} required maxLength={60} value={f.firstName} onChange={maj("firstName")} />
              </Champ>
              <Champ label="Nom" htmlFor="af-nom">
                <input id="af-nom" className={ui.saisie} required maxLength={60} value={f.lastName} onChange={maj("lastName")} />
              </Champ>
            </div>
          </section>
          <section className={styles.pBloc}>
            <Sur>Coordonnées</Sur>
            <div className={ui.g2}>
              <Champ label="Adresse e-mail (identifiant de connexion)" htmlFor="af-email">
                <input id="af-email" type="email" className={ui.saisie} required value={f.email} onChange={maj("email")} />
              </Champ>
              <Champ label="Téléphone" htmlFor="af-tel">
                <input id="af-tel" type="tel" className={ui.saisie} maxLength={30} placeholder="+261 34 00 000 00" value={f.phone} onChange={maj("phone")} />
              </Champ>
            </div>
          </section>
          <section className={styles.pBloc}>
            <Sur>Entreprise</Sur>
            <div className={ui.g2}>
              <Champ label="Entreprise" htmlFor="af-ent">
                <input id="af-ent" className={ui.saisie} maxLength={80} value={f.company} onChange={maj("company")} />
              </Champ>
              <Champ label="Rôle" htmlFor="af-role">
                <input id="af-role" className={ui.saisie} maxLength={80} value={f.role} onChange={maj("role")} />
              </Champ>
            </div>
          </section>
        </form>
      ) : (
        <div className={`${styles.pCorps} ${ui.stagger}`}>
          <div className={styles.pColonnes}>
            <section className={styles.pBloc}>
              <Sur>Coordonnées</Sur>
              <div className={styles.pCoord}>
                <Ligne icon={<MailIcon width={18} height={18} />} label="E-mail" href={`mailto:${admin.email}`}>
                  {admin.email}
                </Ligne>
                <Ligne icon={<PhoneIcon width={18} height={18} />} label="Téléphone" href={admin.phone ? `tel:${admin.phone.replace(/\s/g, "")}` : undefined}>
                  {admin.phone || "Non renseigné"}
                </Ligne>
                <Ligne icon={<BriefcaseIcon width={18} height={18} />} label="Entreprise et rôle">
                  {[admin.company, admin.role].filter(Boolean).join(" · ") || "Non renseignés"}
                </Ligne>
              </div>
            </section>
            <section className={styles.pBloc}>
              <Sur>Accès</Sur>
              <div className={styles.pCoord}>
                <Ligne icon={<ShieldCheckIcon width={18} height={18} />} label="Droits">
                  {admin.superAdmin ? "Super admin : gère les administrateurs" : "Administrateur : accès au back-office"}
                </Ligne>
                <Ligne icon={<CalendarIcon width={18} height={18} />} label="Compte créé le">
                  {dateLongue(admin.creeLe)}
                </Ligne>
                <Ligne icon={<ClockIcon width={18} height={18} />} label="Dernière connexion">
                  {admin.derniereConnexion ? dateHeure(admin.derniereConnexion) : "Pas encore connecté"}
                </Ligne>
              </div>
            </section>
          </div>
          {mode === "retirer" ? <Note tone="red">{admin.nom} perdra l’accès au back-office et redeviendra membre, avec le même compte et le même mot de passe.</Note> : null}
          {mode === "supprimer" ? <Note tone="red">Le compte de {admin.nom} et tout ce qui en dépend seront supprimés définitivement. Cette action est irréversible.</Note> : null}
        </div>
      )}

      <footer className={styles.pPied}>
        {mode === "edition" ? (
          <>
            <Btn key="enregistrer" variant="primary" type="submit" form="admin-fiche-form" disabled={envoi}>
              <CheckIcon width={16} height={16} />
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </Btn>
            <Btn key="annuler" onClick={() => setMode("vue")} disabled={envoi}>
              Annuler
            </Btn>
          </>
        ) : mode === "retirer" || mode === "supprimer" ? (
          <>
            <Btn key="confirmer" variant="primary" onClick={confirmer} disabled={envoi}>
              {envoi ? "En cours…" : mode === "retirer" ? "Confirmer le retrait" : "Supprimer définitivement"}
            </Btn>
            <Btn key="annuler" onClick={() => setMode("vue")} disabled={envoi}>
              Annuler
            </Btn>
          </>
        ) : peutGerer ? (
          <>
            <Btn key="modifier" variant="primary" onClick={() => setMode("edition")}>
              <PencilIcon width={16} height={16} />
              Modifier
            </Btn>
            <Btn key="retirer" onClick={() => setMode("retirer")}>
              Retirer les droits
            </Btn>
            <Btn key="supprimer" className="!text-[#b42318]" onClick={() => setMode("supprimer")}>
              <TrashIcon width={16} height={16} />
              Supprimer le compte
            </Btn>
          </>
        ) : moi ? (
          <Btn variant="primary" href="/admin/compte">
            <PencilIcon width={16} height={16} />
            Modifier mon compte
          </Btn>
        ) : (
          <p className="self-center text-[13px] text-graphite-muted">{admin.superAdmin ? "Un super admin ne se modifie pas depuis la plateforme." : "Seul le super admin peut modifier ce compte."}</p>
        )}
      </footer>
    </Modal>
  );
}
