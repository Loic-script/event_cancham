import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";
import { GlobeIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";

export const metadata: Metadata = { title: "Réseaux sociaux" };

export default function SocialPage() {
  return (
    <>
      <PageTitle title="Réseaux sociaux" subtitle="Les défis publiés par les participants sur les réseaux." />
      <ComingSoon
        icon={<GlobeIcon width={30} height={30} />}
        title="Bientôt sur vos réseaux"
        description="Les publications liées aux défis, partagées sur les réseaux sociaux avec le mot-dièse de la soirée, s'afficheront ici."
      />
    </>
  );
}
