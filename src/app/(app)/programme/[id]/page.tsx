import type { Metadata } from "next";
import { ProgrammeDetail } from "@/components/traversee/programme/Programme";
import { PROGRAMME } from "@/lib/traversee/data";

export async function generateMetadata(props: PageProps<"/programme/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const p = PROGRAMME.find((x) => x.id === id);
  return { title: p ? p.t : "Programme" };
}

export default async function ProgrammeDetailPage(props: PageProps<"/programme/[id]">) {
  const { id } = await props.params;
  return <ProgrammeDetail id={id} />;
}
