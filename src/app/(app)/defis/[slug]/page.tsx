import { notFound, redirect } from "next/navigation";
import { challengeBySlug } from "@/lib/mock/challenges";

export default async function ChallengeRedirect(props: PageProps<"/defis/[slug]">) {
  const { slug } = await props.params;
  if (!challengeBySlug(slug)) notFound();
  redirect(`/decouvrir/${slug}`);
}
