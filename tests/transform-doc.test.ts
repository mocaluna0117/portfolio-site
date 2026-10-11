import { describe, expect, test } from "vitest";
import {
  collectImageRefs,
  countForbidden,
  extractDocHighlights,
  extractH1,
  ForbiddenTextError,
  parseForbidden,
  resolveRelative,
  stripNameRow,
  tidyHeading,
  transformDoc,
} from "@convex/lib/transformDoc";

// Shaped like the real documents, with a made-up name.
const DOC = `<h1 align="center">Sample — 試しの作品<br>作品説明資料</h1>

とある**試し**の作品である。

| 項目 | 内容 |
|---|---|
| 氏名 | 山田 太郎 |
| 区分 | 個人開発 |

<p align="center">
  <img src="images/home.png" width="49%" alt="ホーム" />
  <img src="images/list.png" width="49%" alt="一覧" />
</p>
<p align="center"><sub>左: ホーム ／ 右: 一覧</sub></p>

## 5. 技術的に工夫した点

### (1) 遅さの原因を測って特定した ⏱️

本文。

\`\`\`html
<img src="images/not-shown.png" />
### (9) コードの中の見出しは数えない
\`\`\`

### (2) 使う人を想定した細部 🧑‍🔧

![構成図](images/architecture.png "構成")

## 6. 他の開発にも活かせると考える点

### これは工夫の章ではない
`;

describe("extractH1", () => {
  test("takes the centred title off and drops 作品説明資料", () => {
    const { title, rest } = extractH1(DOC);
    expect(title).toBe("Sample — 試しの作品");
    expect(rest.startsWith("とある**試し**の作品である。")).toBe(true);
  });

  test("accepts <br/> and a Markdown heading", () => {
    expect(extractH1("<h1>A<br/>作品説明資料</h1>\nbody").title).toBe("A");
    expect(extractH1("# Plain title\n\nbody")).toEqual({ title: "Plain title", rest: "body" });
  });

  test("leaves a document without a title alone", () => {
    expect(extractH1("just text")).toEqual({ title: null, rest: "just text" });
  });
});

describe("stripNameRow", () => {
  test("removes only the name row of a table", () => {
    const out = stripNameRow(DOC);
    expect(out).not.toContain("山田 太郎");
    expect(out).toContain("| 区分 | 個人開発 |");
  });

  test("leaves 氏名 in prose", () => {
    expect(stripNameRow("お客様の氏名を伏せる。\n")).toBe("お客様の氏名を伏せる。\n");
  });
});

describe("countForbidden", () => {
  test("finds a word however it is spaced", () => {
    const forbidden = parseForbidden(" 山田 太郎 , ,yamada ");
    expect(forbidden).toEqual(["山田 太郎", "yamada"]);
    expect(countForbidden("山田太郎と 山田　太郎 と YAMADA", forbidden)).toBe(3);
    expect(countForbidden("無関係", forbidden)).toBe(0);
  });
});

describe("collectImageRefs", () => {
  test("finds <img> and ![]() once each, in order, not in code", () => {
    expect(collectImageRefs(DOC)).toEqual([
      "images/home.png",
      "images/list.png",
      "images/architecture.png",
    ]);
  });

  test("ignores absolute and data URLs", () => {
    const doc =
      '<img src="https://example.com/a.png"> ![x](/root.png) ![y](data:image/png;base64,AA)';
    expect(collectImageRefs(doc)).toEqual([]);
  });
});

describe("resolveRelative", () => {
  test("from a document in docs/portfolio", () => {
    expect(resolveRelative("docs/portfolio/PORTFOLIO.md", "images/a.png")).toBe(
      "docs/portfolio/images/a.png",
    );
    expect(resolveRelative("docs/portfolio/PORTFOLIO.md", "../shot.png")).toBe("docs/shot.png");
  });

  test("from a README at the root", () => {
    expect(resolveRelative("README.md", "./images/a.png")).toBe("images/a.png");
  });

  test("refuses to climb out of the repository", () => {
    expect(resolveRelative("README.md", "../secret.png")).toBeNull();
  });
});

describe("highlights", () => {
  test("tidies a heading", () => {
    expect(tidyHeading("(1) 検索の精度を「測って」上げた 📏")).toBe("検索の精度を「測って」上げた");
    expect(tidyHeading("(4) 使う人を想定した細部 🧑‍🔧")).toBe("使う人を想定した細部");
  });

  test("reads the ### headings of the 工夫 chapter only", () => {
    expect(extractDocHighlights(DOC)).toEqual([
      "遅さの原因を測って特定した",
      "使う人を想定した細部",
    ]);
  });
});

describe("transformDoc", () => {
  test("puts it all together", () => {
    const out = transformDoc(DOC, ["山田 太郎"]);
    expect(out.docTitle).toBe("Sample — 試しの作品");
    expect(out.markdown).not.toContain("<h1");
    expect(out.markdown).not.toContain("山田");
    expect(out.imageRefs).toHaveLength(3);
    expect(out.docHighlights).toHaveLength(2);
  });

  test("refuses a document that still names someone", () => {
    const doc = `${DOC}\n連絡先: 山田太郎\n`;
    expect(() => transformDoc(doc, ["山田 太郎"])).toThrow(ForbiddenTextError);
  });

  test("normalises Windows line endings", () => {
    const out = transformDoc("<h1>T</h1>\r\n\r\n| 氏名 | 山田 |\r\n| 区分 | x |\r\n", []);
    expect(out.markdown).toBe("| 区分 | x |\n");
  });
});
