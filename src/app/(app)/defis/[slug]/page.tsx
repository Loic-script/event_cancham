import { notFound, redirect } from "next/navigation";
import { challengeBySlug } from "@/lib/mock/challenges";

// Les pages de détail des défis vivent dans l'espace « Découvrir les défis » ;
// cette ancienne adresse y redirige pour conserver les liens existants.
export default async function ChallengeRedirect(props: PageProps<"/defis/[slug]">) {
  const { slug } = await props.params;
  if (!challengeBySlug(slug)) notFound();
  redirect(`/decouvrir/${slug}`);
}
