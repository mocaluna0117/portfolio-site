import type { WorkLink, WorkSource, WorkStatus } from "./lib/validators";

type SeedWork = {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  tags: string[];
  status: WorkStatus;
  links: WorkLink[];
  source: WorkSource;
};

const GITHUB = "https://github.com/mocaluna0117";

const portfolioDoc = (repo: string, video: string): WorkSource => ({
  repo: `mocaluna0117/${repo}`,
  ref: "main",
  docPath: "docs/portfolio/PORTFOLIO.md",
  videoPath: `docs/portfolio/${video}`,
});

/**
 * The works the site starts with, in order. Written once by `seed:run` and
 * edited in the admin screen after that; seeding again leaves existing works
 * as they are.
 */
export const SEED_WORKS: SeedWork[] = [
  {
    slug: "manualy",
    title: "Manualy",
    subtitle: "社内マニュアル検索システム（RAG）",
    tagline: "とある企業で実際に使われている、社内マニュアルを AI に質問して探せる Web アプリ",
    tags: ["React", "NestJS", "Python", "PostgreSQL"],
    status: "production",
    links: [{ label: "ソースコード", url: `${GITHUB}/manualy` }],
    source: portfolioDoc("manualy", "manualy-demo.mp4"),
  },
  {
    slug: "folio",
    title: "Folio",
    subtitle: "報告書の処理を自動化する業務アプリ",
    tagline:
      "勤務先の業務で使っている、報告書の PDF から Excel の転記行・完了報告書を作り、社内システムから承認済みの申請書の PDF を取得してまとめる Web アプリ",
    tags: ["Next.js", "TypeScript", "pdf.js", "Gemini", "Playwright"],
    status: "production",
    // The source is private; this repository has the document and the video.
    links: [{ label: "作品説明資料（GitHub）", url: `${GITHUB}/folio` }],
    source: {
      repo: "mocaluna0117/folio",
      ref: "main",
      docPath: "README.md",
      videoPath: "folio-demo.mp4",
    },
  },
  {
    slug: "memoca",
    title: "Memoca",
    subtitle: "オフラインでも書ける暗号化メモアプリ",
    tagline:
      "オフラインでも読み書きでき、2台の編集を失わずにまとめ、ロックしたメモを端末で暗号化するメモアプリ（PWA と Mac・Windows のデスクトップ版）",
    tags: ["Next.js", "Convex", "Yjs", "WebCrypto", "Tauri"],
    status: "public",
    links: [
      { label: "公開中のアプリ", url: "https://memoca-app.vercel.app" },
      { label: "ソースコード", url: `${GITHUB}/memoca` },
      { label: "デスクトップ版", url: `${GITHUB}/memoca/releases/latest` },
    ],
    source: portfolioDoc("memoca", "memoca-demo.mp4"),
  },
  {
    slug: "moca-home",
    title: "もかのほーむ",
    subtitle: "愛犬の記録と買い物の管理アプリ",
    tagline: "愛犬の毎日の記録と、ペット用品の通販サイトで買ったものを 1 か所にまとめた Web アプリ",
    tags: ["Next.js", "TypeScript", "libSQL"],
    status: "personal",
    links: [{ label: "ソースコード", url: `${GITHUB}/moca_home` }],
    source: portfolioDoc("moca_home", "moca-home-demo.mp4"),
  },
  {
    slug: "todo",
    title: "TODO アプリ",
    subtitle: "Flutter のタスク管理アプリ",
    tagline:
      "スマートフォン・PC のどちらからでも同じタスクを扱える、iOS・Android・Web 対応のタスク管理アプリ",
    tags: ["Flutter", "Firebase"],
    status: "personal",
    links: [{ label: "ソースコード", url: `${GITHUB}/TODO_APP_ver3` }],
    source: portfolioDoc("TODO_APP_ver3", "todo-demo.mp4"),
  },
  {
    slug: "ball-split",
    title: "Ball Split",
    subtitle: "分裂ボール・シミュレーション",
    tagline:
      "ぶつかるたびに分裂して 65536 個まで増えるボールの 2D シミュレーション。当たり判定・空間分割を自作",
    tags: ["C++17", "SDL2"],
    status: "distributed",
    links: [
      { label: "ソースコード", url: `${GITHUB}/ball-split` },
      { label: "ダウンロード（Windows）", url: `${GITHUB}/ball-split/releases/tag/v1.0` },
    ],
    source: portfolioDoc("ball-split", "ballsplit-demo.mp4"),
  },
];
