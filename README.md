# もかるな — ポートフォリオサイト

作品を紹介するサイトです。各作品のページには、その作品のリポジトリにある作品説明資料（`docs/portfolio/PORTFOLIO.md`）を、画像・動作紹介動画ごと取り込んで載せています。

- 公開ページ: トップ（自己紹介・作品一覧・お問い合わせ）と作品ごとのページ
- 管理画面: `/login0117` から Google アカウントでログインし、作品の並び順・公開/非公開・表示内容・サムネイル・自己紹介を編集する。資料を直したら「GitHub から取り込み直す」で反映する

## 技術スタック

| 層             | 使っているもの                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| フロントエンド | Next.js 16（App Router・Cache Components・Partial Prefetching）、React 19、TypeScript、Tailwind CSS v4、shadcn/ui           |
| バックエンド   | Convex（データベース・画像と動画の保存・取り込みのバックグラウンド処理）、Better Auth（Google ログイン、Convex 上で動かす） |
| 作品説明の表示 | react-markdown、remark-gfm、rehype-raw、rehype-sanitize（GitHub と同じ許可リスト）、rehype-slug                             |
| お問い合わせ   | Cloudflare Turnstile（bot 対策）、Convex の rate limiter、Resend（メール送信）                                              |
| テスト         | Vitest（単体・convex-test）、Playwright（E2E）                                                                              |
| 配信           | Vercel Hobby + Convex Free（費用 0 円）                                                                                     |

## 仕組み

```
GitHub（各作品の docs/portfolio）
   │  管理画面の「取り込み直す」/ pnpm seed
   ▼
Convex action: importWork.run ── 本文を整える（題名を外す・氏名の行を消す・本名が残っていたら止める）
   │                              画像と動画を Convex のストレージへ
   ▼
Convex DB（works / workDocs / workFiles）
   │  変更があるたびに revalidate.site が /api/revalidate を呼ぶ
   ▼
Next.js（"use cache" + cacheTag("portfolio")）── 静的に配信し、変更時だけ作り直す
```

- 公開ページは Next.js のキャッシュから配信します。Convex 側でデータが変わると、Convex が `/api/revalidate` を呼んでキャッシュを捨てるので、管理画面で直した内容は数秒で公開ページに出ます。
- 管理者の確認は2重です。Next.js の管理画面のレイアウトでログインと管理者かどうかを確かめ、Convex の関数もそれぞれ `requireAdmin` で確かめます。管理者以外の Google アカウントは、アカウント自体が作られません（Better Auth の `databaseHooks`）。

## ローカルで動かす

```bash
pnpm install
# Convex をこのパソコンの中だけで動かす（アカウント不要）
CONVEX_AGENT_MODE=anonymous npx convex dev
```

初回だけ、別のターミナルで Convex の環境変数を入れます（値の意味は `.env.example`）。

```bash
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set SITE_URL http://localhost:3000
npx convex env set ADMIN_EMAILS admin@example.test
npx convex env set ALLOW_PASSWORD_AUTH true
npx convex env set IMPORT_FORBIDDEN_STRINGS "<本名>,<本名（空白なし）>"
npx convex env set TURNSTILE_SECRET_KEY 1x0000000000000000000000000000000AA
npx convex env set REVALIDATE_SECRET "$(openssl rand -hex 24)"
```

`.env.local` に `.env.example` の Next.js 側の値を足し（`REVALIDATE_SECRET` は Convex と同じ値、`NEXT_PUBLIC_DEV_PASSWORD_LOGIN=true`）、作品を入れてから起動します。

```bash
pnpm seed     # 6作品を作り、GitHub から取り込む
pnpm dev      # http://localhost:3000
```

ローカルでは `/login0117` に開発用のメールアドレス欄が出ます。`admin@example.test` と任意のパスワードでログインできます（初回にアカウントが作られる）。

## テスト

```bash
pnpm test        # 単体テストと Convex 関数のテスト
pnpm e2e         # E2E（上の手順で動かしているローカル環境に対して）
pnpm lint && pnpm typecheck
```

## デプロイ

[docs/DEPLOY.md](docs/DEPLOY.md) を参照してください。
