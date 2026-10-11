import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { DocImage, type DocImageFile } from "@/components/markdown/doc-image";

/**
 * GitHub's own rules for what HTML a README may contain (the default schema
 * already keeps align, width, <sub> and <sup>), so a document looks here as
 * it does on GitHub and nothing it holds can run script on the site.
 */
const schema = defaultSchema;

const isExternal = (href: string | undefined) => !!href && /^https?:\/\//.test(href);

/**
 * A work's document, rendered on the server. Headings get ids after
 * sanitising (so they are not prefixed), matching src/lib/markdown/toc.ts.
 */
export function MarkdownDoc({
  markdown,
  images,
}: {
  markdown: string;
  images: ({ path: string } & DocImageFile)[];
}) {
  const byPath = new Map(images.map((image) => [image.path, image]));
  return (
    <div className="doc">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug]}
        components={{
          img: ({ src, alt, width }) => {
            const path = typeof src === "string" ? src : "";
            return (
              <DocImage
                src={path}
                alt={alt ?? ""}
                width={width === undefined ? undefined : String(width)}
                file={byPath.get(path)}
              />
            );
          },
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-md border">
              <table className="my-0 w-full">{children}</table>
            </div>
          ),
          a: ({ href, children }) =>
            isExternal(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <a href={href}>{children}</a>
            ),
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
