import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MarkdownDoc } from "@/components/markdown/markdown-doc";
import { extractToc } from "@/lib/markdown/toc";

const DOC = `とある作品である。

| 項目 | 内容 |
|---|---|
| 区分 | 個人開発 |

<p align="center">
  <img src="images/home.png" width="49%" alt="ホーム" />
  <img src="images/missing.png" alt="無い画像" />
</p>
<p align="center"><sub>説明</sub> 2<sup>16</sup></p>

## 1. 制作意図

<script>alert(1)</script>
<img src="x" onerror="alert(1)">

## 5. 技術的に工夫した点

### (1) 遅さの原因を測って特定した ⏱️

### (2) Safari でも画像を小さくする

## 5. 技術的に工夫した点

[外部](https://example.com) と [中](#1-制作意図)
`;

const IMAGES = [
  {
    path: "images/home.png",
    url: "https://x.convex.cloud/api/storage/1",
    width: 1440,
    height: 900,
  },
];

function render(markdown = DOC) {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(<MarkdownDoc markdown={markdown} images={IMAGES} />);
  return host;
}

describe("MarkdownDoc", () => {
  test("keeps the documents' centred paragraphs, captions and superscripts", () => {
    const host = render();
    expect(host.querySelector('p[align="center"] sub')?.textContent).toBe("説明");
    expect(host.querySelector("sup")?.textContent).toBe("16");
  });

  test("wraps tables so they scroll sideways on a phone", () => {
    const table = render().querySelector("table");
    expect(table?.parentElement?.className).toContain("overflow-x-auto");
  });

  test("points an imported image at its stored file, at the width the document gave", () => {
    const host = render();
    const image = host.querySelector('img[alt="ホーム"]');
    expect(image?.getAttribute("src")).toBe(IMAGES[0].url);
    expect((image?.parentElement as HTMLElement).style.width).toBe("49%");
    // Not imported: shown as its alt text, never as a broken relative URL.
    expect(host.querySelector('img[alt="無い画像"]')).toBeNull();
    expect(host.textContent).toContain("無い画像");
  });

  test("runs no script from a document", () => {
    const host = render();
    expect(host.querySelector("script")).toBeNull();
    expect(host.innerHTML).not.toContain("onerror");
  });

  test("opens outside links in a new tab, and keeps in-page ones", () => {
    const host = render();
    const outside = host.querySelector('a[href="https://example.com"]');
    expect(outside?.getAttribute("target")).toBe("_blank");
    expect(outside?.getAttribute("rel")).toContain("noopener");
    // The fragment is percent-encoded, which a browser decodes to the heading's id.
    const inside = [...host.querySelectorAll("a")].find((a) => a.textContent === "中");
    expect(decodeURIComponent(inside?.getAttribute("href") ?? "")).toBe("#1-制作意図");
    expect(inside?.getAttribute("target")).toBeNull();
  });

  test("gives headings the ids the table of contents links to", () => {
    const host = render();
    const ids = [...host.querySelectorAll("h2, h3")].map((heading) => heading.id);
    const toc = extractToc(DOC);
    expect(toc.map((item) => item.id)).toEqual(ids);
    // A repeated heading gets a suffix on both sides alike.
    expect(new Set(ids).size).toBe(ids.length);
    expect(toc.find((item) => item.depth === 3)?.text).toBe("遅さの原因を測って特定した");
  });
});
