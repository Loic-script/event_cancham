"use client";

import { useId, type JSX, type ReactNode } from "react";
import {
  ArmchairIcon,
  BellIcon,
  CalendarDaysIcon,
  CameraIcon,
  CartIcon,
  ContactsIcon,
  FolderIcon,
  GiftIcon,
  HomeIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  MessageCircleOutlineIcon,
  QrIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
  type IconProps,
} from "./icons";

type Icone = (props: IconProps) => JSX.Element;

/** Icône de navigation : en contour, et pleine sur la page ouverte. */
export type IconeNav = { contour: Icone; plein: Icone };

/**
 * La silhouette est remplie ; les détails (porte, coche, lignes…) sont évidés
 * par un masque, pour laisser voir le fond quelle que soit sa couleur.
 */
function plein(name: string, silhouette: ReactNode, details?: ReactNode) {
  function Icon(props: IconProps) {
    const id = useId();
    return (
      <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden {...props}>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <g fill="#fff" stroke="#fff" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            {silhouette}
          </g>
          {details ? (
            <g fill="#000" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {details}
            </g>
          ) : null}
        </mask>
        <rect width="24" height="24" fill="currentColor" mask={`url(#${id})`} />
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

const HomePlein = plein("HomePlein", <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>, <path d="M10.5 21v-5h3v5" />);

const CalendrierPlein = plein(
  "CalendrierPlein",
  <><path d="M4 5h16v16H4z" /><path d="M8 3v4M16 3v4" /></>,
  <path d="M5 10h14M8 14h1.5M12 14h1.5M8 17h1.5" />,
);

const TrophePlein = plein(
  "TrophePlein",
  <>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" fill="none" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" fill="none" />
    <path d="M10 14.5h4V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22H7c0-1.76.85-3.25 2.03-3.79.5-.23.97-.66.97-1.21Z" />
    <path d="M4 22h16" />
  </>,
);

const CadeauPlein = plein(
  "CadeauPlein",
  <>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" fill="none" />
  </>,
  <path d="M12 8.5v14M2 12.5h20" />,
);

const AnnuairePlein = plein("AnnuairePlein", <path d="M5 3h14v18H5z" />, <path d="M9 8h6M9 12h6M9 16h3" />);

const DossierPlein = plein("DossierPlein", <path d="M3 6h7l2 2h9v11H3z" />);

const AppareilPlein = plein(
  "AppareilPlein",
  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />,
  <circle cx="12" cy="13" r="3.25" fill="none" />,
);

const PersonnesPlein = plein(
  "PersonnesPlein",
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2Z" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" />
  </>,
);

const MegaphonePlein = plein(
  "MegaphonePlein",
  <>
    <path d="M4 10v4h3l6 4V6l-6 4z" />
    <path d="M16 9a4 4 0 0 1 0 6" fill="none" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" fill="none" />
  </>,
);

const BouclierPlein = plein(
  "BouclierPlein",
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  <path d="m9 12 2 2 4-4" fill="none" />,
);

const QrPlein = plein(
  "QrPlein",
  <>
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <rect x="16" y="3" width="5" height="5" rx="1" />
    <rect x="3" y="16" width="5" height="5" rx="1" />
    <g fill="none">
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" />
    </g>
  </>,
);

const FauteuilPlein = plein(
  "FauteuilPlein",
  <>
    <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4z" />
    <path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" />
    <path d="M6 19v2M18 19v2" fill="none" />
  </>,
);

const PanierPlein = plein(
  "PanierPlein",
  <>
    <path d="M4 6h16l-1.5 9h-13z" />
    <path d="M4 6 3 3H1" fill="none" />
    <circle cx="8" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </>,
);

export const ClochePleine = plein(
  "ClochePleine",
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" />
  </>,
);

export const ICONES = {
  accueil: { contour: HomeIcon, plein: HomePlein },
  programme: { contour: CalendarDaysIcon, plein: CalendrierPlein },
  trophee: { contour: TrophyIcon, plein: TrophePlein },
  cadeau: { contour: GiftIcon, plein: CadeauPlein },
  annuaire: { contour: ContactsIcon, plein: AnnuairePlein },
  messagerie: { contour: MessageCircleOutlineIcon, plein: MessageCircleIcon },
  dossier: { contour: FolderIcon, plein: DossierPlein },
  appareil: { contour: CameraIcon, plein: AppareilPlein },
  personnes: { contour: UsersIcon, plein: PersonnesPlein },
  megaphone: { contour: MegaphoneIcon, plein: MegaphonePlein },
  bouclier: { contour: ShieldCheckIcon, plein: BouclierPlein },
  qr: { contour: QrIcon, plein: QrPlein },
  panier: { contour: CartIcon, plein: PanierPlein },
  fauteuil: { contour: ArmchairIcon, plein: FauteuilPlein },
  cloche: { contour: BellIcon, plein: ClochePleine },
} satisfies Record<string, IconeNav>;

export function IconeNavigation({ icone, active, ...props }: { icone: IconeNav; active: boolean } & IconProps) {
  const Icone = active ? icone.plein : icone.contour;
  return <Icone {...props} />;
}
