import Image from "next/image";
import type { CSSProperties } from "react";

export type DocImageFile = { url: string; width: number | null; height: number | null };

/** The column a document is set in, at its widest. */
const COLUMN_PX = 760;

/** "49%" → 0.49; "300" → pixels; nothing → the full column. */
function share(width: string | undefined): { style?: CSSProperties; fraction: number } {
  if (!width) return { fraction: 1 };
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(width);
  if (percent) {
    const fraction = Math.min(Number(percent[1]) / 100, 1);
    return { style: { width: `${fraction * 100}%` }, fraction };
  }
  const pixels = /^(\d+)(?:px)?$/.exec(width);
  if (pixels) {
    const px = Number(pixels[1]);
    return { style: { width: `${px}px`, maxWidth: "100%" }, fraction: Math.min(px / COLUMN_PX, 1) };
  }
  return { fraction: 1 };
}

/**
 * An image of a work's document, as the document sized it ("49%" puts two
 * side by side). Imported images are served through next/image, which sends
 * each browser a copy no larger than it needs; the size known from the
 * import reserves the space before it loads.
 *
 * Inside a <span>, not a <div>: the documents put images in <p>.
 */
export function DocImage({
  src,
  alt,
  width,
  file,
}: {
  src: string;
  alt: string;
  width?: string;
  file: DocImageFile | undefined;
}) {
  const { style, fraction } = share(width);
  const wrapperStyle: CSSProperties = { display: "inline-block", verticalAlign: "top", ...style };

  if (file?.width && file.height) {
    return (
      <span style={wrapperStyle} className="px-[0.5%]">
        <Image
          src={file.url}
          alt={alt}
          width={file.width}
          height={file.height}
          sizes={`(min-width: 1024px) ${Math.round(COLUMN_PX * fraction)}px, ${Math.round(100 * fraction)}vw`}
          className="h-auto w-full"
        />
      </span>
    );
  }

  const url = file?.url ?? (/^https?:\/\//.test(src) ? src : null);
  if (!url) {
    return (
      <span className="inline-block rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        {alt || src}
      </span>
    );
  }
  return (
    <span style={wrapperStyle} className="px-[0.5%]">
      {/* Size unknown (not a PNG, or not imported): shown as it comes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" className="h-auto w-full" />
    </span>
  );
}
