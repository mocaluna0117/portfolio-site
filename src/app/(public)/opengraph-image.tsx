import { getProfile } from "@/lib/data";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "もかるな — 作品集";

export default async function Image() {
  const profile = await getProfile();
  return ogCard({
    eyebrow: "作品集",
    title: profile.handle,
    subtitle: profile.intro,
    footer: profile.githubUrl.replace(/^https:\/\//, ""),
  });
}
