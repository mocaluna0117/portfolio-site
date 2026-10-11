/**
 * What an imported work document goes through before it is stored. Pure
 * functions only, so they run the same in a Convex action and in a unit test.
 *
 * The documents are the "作品説明資料" kept in each work's repository: GitHub
 * flavoured Markdown with a little raw HTML (a centred <h1>, centred images
 * with a width, <sub> captions). They are stored as written apart from the
 * changes below, so a stored document can be compared with its source.
 */

export type TransformedDoc = {
  /** The document without its leading title, the name row removed. */
  markdown: string;
  /** The leading <h1>'s text, without "作品説明資料". */
  docTitle: string;
  /** The ### headings under the "工夫" chapter, tidied for a list. */
  docHighlights: string[];
  /** Relative image references, as written, each once, in document order. */
  imageRefs: string[];
};

export class ForbiddenTextError extends Error {
  constructor(public readonly count: number) {
    super(`公開できない文字列が本文に ${count} か所残っています。取り込みを中止しました。`);
    this.name = "ForbiddenTextError";
  }
}

const H1_HTML = /^<h1\b[^>]*>([\s\S]*?)<\/h1>\s*$/i;
const H1_MD = /^#\s+(.+?)\s*#*\s*$/;

/** Takes the document's first non-blank line off when it is its title. */
export function extractH1(markdown: string): { title: string | null; rest: string } {
  const lines = markdown.split("\n");
  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1) return { title: null, rest: markdown };
  const line = lines[first].trim();
  const match = H1_HTML.exec(line) ?? H1_MD.exec(line);
  if (!match) return { title: null, rest: markdown };
  const title = match[1]
    .replace(/<br\s*\/?>\s*作品説明資料\s*$/i, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const rest = lines
    .slice(first + 1)
    .join("\n")
    .replace(/^\s*\n/, "");
  return { title, rest };
}

/**
 * Removes the "| 氏名 | … |" row of the document's leading table. The site
 * goes by a handle; the documents were written for applications under a
 * real name.
 */
export function stripNameRow(markdown: string): string {
  return markdown.replace(/^\|\s*氏名\s*\|[^\n]*(?:\n|$)/gm, "");
}

/** How many times any of the strings appears, ignoring case and spaces. */
export function countForbidden(markdown: string, forbidden: readonly string[]): number {
  const squash = (text: string) => text.replace(/[\s　]+/g, "").toLowerCase();
  const haystack = squash(markdown);
  let count = 0;
  for (const word of forbidden) {
    const needle = squash(word);
    if (!needle) continue;
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      count += 1;
      at = haystack.indexOf(needle, at + needle.length);
    }
  }
  return count;
}

/** The comma-separated list in IMPORT_FORBIDDEN_STRINGS, as an array. */
export function parseForbidden(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

const IMG_TAG = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/gi;
const MD_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g;

/** Whether a reference points inside the repository rather than elsewhere. */
export function isRelativeRef(ref: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(ref);
}

/** The images a document shows from its own repository, each once. */
export function collectImageRefs(markdown: string): string[] {
  // Code is quoted, not shown: an <img> inside a fence is an example.
  const shown = markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
  const refs: string[] = [];
  for (const match of shown.matchAll(IMG_TAG)) refs.push(match[2]);
  for (const match of shown.matchAll(MD_IMAGE)) refs.push(match[1]);
  return [...new Set(refs.map((ref) => ref.trim()).filter(isRelativeRef))];
}

/**
 * A reference from the document, as a path from the repository root.
 * Null when it climbs out of the repository.
 */
export function resolveRelative(docPath: string, ref: string): string | null {
  const base = docPath.split("/").slice(0, -1);
  const parts = [...base];
  for (const part of ref.split("?")[0].split("#")[0].split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.length ? parts.join("/") : null;
}

/** "(1) 検索の精度を「測って」上げた 📏" → "検索の精度を「測って」上げた". */
export function tidyHeading(heading: string): string {
  return heading
    .replace(/^\(\d+\)\s*/, "")
    .replace(/^\d+[.)．]\s*/, "")
    .replace(/[\s\p{Extended_Pictographic}\u200d\ufe0f]+$/u, "")
    .trim();
}

/** The ### headings of the chapter about what was worked out ("工夫"). */
export function extractDocHighlights(markdown: string, limit = 6): string[] {
  const highlights: string[] = [];
  let inside = false;
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    if (/^##\s/.test(line)) {
      inside = /工夫/.test(line);
      continue;
    }
    if (inside && /^###\s/.test(line)) {
      const text = tidyHeading(line.replace(/^###\s+/, ""));
      if (text) highlights.push(text);
      if (highlights.length >= limit) break;
    }
  }
  return highlights;
}

/** Everything above, in order. Throws when a forbidden string remains. */
export function transformDoc(raw: string, forbidden: readonly string[]): TransformedDoc {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const { title, rest } = extractH1(normalized);
  const markdown = stripNameRow(rest);
  const docTitle = title ?? "";
  const found = countForbidden(`${docTitle}\n${markdown}`, forbidden);
  if (found > 0) throw new ForbiddenTextError(found);
  return {
    markdown,
    docTitle,
    docHighlights: extractDocHighlights(markdown),
    imageRefs: collectImageRefs(markdown),
  };
}
