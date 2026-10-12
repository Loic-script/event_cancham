import type { Metadata } from "next";
import { Photos } from "@/components/traversee/photos/Photos";

export const metadata: Metadata = { title: "Photos et vidéos" };

export default function PhotosPage() {
  return <Photos />;
}
