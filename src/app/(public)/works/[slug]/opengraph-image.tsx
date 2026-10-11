import { getProfile, getWork } from "@/lib/data";
import { OG_SIZE, ogCard } from "@/lib/og";
import { siteUrl } from "@/lib/site-url";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "作品の紹介";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [work, profile] = await Promise.all([getWork(slug), getProfile()]);
  return ogCard({
    eyebrow: `${profile.handle} の作品`,
    title: work?.title ?? "作品",
    subtitle: work?.subtitle,
    tags: work?.tags ?? [],
    footer: new URL(siteUrl()).host,
  });
}
