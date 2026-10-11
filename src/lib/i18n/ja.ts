import type { WorkStatus } from "@convex/lib/validators";

/**
 * Every string the site shows, in one place, so another language can be
 * added later by adding a file beside this one.
 */
export const ja = {
  site: {
    description:
      "もかるなの作品集。Web アプリを中心に、企画から設計・実装・運用までを手がけた作品を紹介しています。",
    skipToContent: "本文へ移動",
  },
  nav: {
    works: "作品",
    contact: "お問い合わせ",
    github: "GitHub",
    home: "トップ",
    theme: "表示テーマを切り替える",
    themes: { light: "ライト", dark: "ダーク", system: "システムに合わせる" },
  },
  home: {
    viewWorks: "作品を見る",
    worksTitle: "作品",
    worksLead: "それぞれの作品のページで、制作意図・機能・技術的な工夫・動作紹介動画を見られます。",
    noWorks: "公開中の作品はまだありません。",
  },
  work: {
    back: "作品一覧へ戻る",
    highlights: "見どころ",
    video: "動作紹介動画",
    watchVideo: "動画を見る",
    videoUnsupported: "このブラウザでは動画を再生できません。",
    doc: "作品説明",
    toc: "目次",
    noDoc: "作品説明はまだ取り込まれていません。",
    importedAt: (date: string) => `GitHub の資料から ${date} に取り込み`,
    viewSource: "GitHub で元の資料を見る",
    tags: "使用技術",
  },
  contact: {
    title: "お問い合わせ",
    lead: "作品へのご質問やお仕事のご相談は、こちらのフォームからお送りください。内容を確認して、メールでお返事します。",
    name: "お名前",
    email: "メールアドレス",
    body: "内容",
    send: "送信する",
    waitForCheck: "送信前の確認が終わるまでお待ちください。",
    failed: "送信できませんでした。時間をおいてもう一度お試しください。",
    thanksTitle: "送信しました。ありがとうございます。",
    thanksBody: "内容を確認して、いただいたメールアドレスにお返事します。",
    another: "もう一件送る",
    privacy: "いただいたお名前とメールアドレスは、お返事のためだけに使います。",
    unavailable: "お問い合わせフォームは準備中です。GitHub からご連絡ください。",
  },
  status: {
    production: "実運用中",
    public: "公開中",
    distributed: "配布中",
    personal: "個人で利用中",
    archived: "過去の作品",
  } satisfies Record<WorkStatus, string>,
  footer: {
    copyright: (year: number, handle: string) => `© ${year} ${handle}`,
  },
  notFound: {
    title: "ページが見つかりません",
    body: "URL が間違っているか、ページが非公開になっています。",
    home: "トップへ戻る",
  },
} as const;

export const t = ja;
