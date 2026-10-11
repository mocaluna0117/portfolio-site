import GithubSlugger from "github-slugger";
import type { Heading, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type TocItem = { depth: 2 | 3; text: string; id: string };

/** "(1) 検索の精度を「測って」上げた 📏" reads better without the number and icon. */
export function tocLabel(text: string): string {
  return text
    .replace(/^\(\d+\)\s*/, "")
    .replace(/[\s\p{Extended_Pictographic}\u200d\ufe0f]+$/u, "")
    .trim();
}

function headings(nodes: RootContent[], out: Heading[]): Heading[] {
  for (const node of nodes) {
    if (node.type === "heading") out.push(node);
    else if ("children" in node) {
      headings(node.children as RootContent[], out);
    }
  }
  return out;
}

/**
 * The document's ## and ### headings with the ids rehype-slug gives them.
 *
 * Every heading is slugged, in document order, by the same slugger
 * rehype-slug uses, so a repeated heading gets the same "-1" suffix here as
 * on the page and the links land where they should.
 */
export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  for (const heading of headings(tree.children, [])) {
    const text = toString(heading);
    const id = slugger.slug(text);
    if (heading.depth === 2 || heading.depth === 3) {
      items.push({ depth: heading.depth, text: tocLabel(text), id });
    }
  }
  return items;
}
