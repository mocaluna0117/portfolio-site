import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Noto Sans JP holding just the characters given: the image renderer's own
 * font has no Japanese, and the whole family is megabytes. Asked for without
 * a browser's user agent, Google Fonts answers with TrueType, which the
 * renderer reads.
 */
async function japaneseFont(text: string): Promise<ArrayBuffer | null> {
  "use cache";
  cacheLife("max");
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

/** The card shown when a page is shared: white, one accent, the title large. */
export async function ogCard({
  eyebrow,
  title,
  subtitle,
  tags = [],
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  footer: string;
}) {
  const text = [eyebrow, title, subtitle ?? "", ...tags, footer].join("");
  const font = await japaneseFont(text);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#ffffff",
        borderTop: "16px solid #1f5fbf",
        fontFamily: font ? "Noto Sans JP" : undefined,
        color: "#16181d",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 30, color: "#1f5fbf" }}>{eyebrow}</div>
        <div style={{ fontSize: 76, marginTop: 24, lineHeight: 1.2 }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 38, marginTop: 20, color: "#5b6170", lineHeight: 1.4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, maxWidth: 800 }}>
          {tags.slice(0, 6).map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 26,
                padding: "6px 16px",
                borderRadius: 10,
                background: "#eef1f6",
                color: "#3d4350",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, color: "#5b6170" }}>{footer}</div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: font
        ? [{ name: "Noto Sans JP", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
