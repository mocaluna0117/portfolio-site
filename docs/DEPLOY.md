# 本番に出す（Vercel + Convex、費用 0 円）

公開先は `https://mocaluna-portfolio.vercel.app`。どれも無料プランで足ります。

| サービス             | 使うもの                              | 無料枠の目安                                                        |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Vercel（Hobby）      | サイトの配信                          | 個人の非商用サイト向け                                              |
| Convex（Free）       | DB・画像と動画・関数                  | DB 0.5GB、ファイル 1GB、ファイル転送 1GB/月                         |
| Google Cloud         | Google ログイン（OAuth クライアント） | 無料                                                                |
| Cloudflare Turnstile | お問い合わせの bot 対策               | 無料                                                                |
| Resend               | お問い合わせのメール通知              | 3,000 通/月（独自ドメインなしでも、自分の確認済みアドレスには届く） |

> 動画6本で約32MB あります。訪問者が全部の動画を見ると1人あたり約32MB 使うので、Convex のファイル転送 1GB/月は「動画を全部見る人が月30人程度」までです。超えそうなら Convex のダッシュボードで使用量を見て、動画を YouTube の限定公開に切り替えることを考えます。

## 1. リポジトリ

```bash
gh repo create mocaluna0117/portfolio-site --public --source . --push
```

## 2. Convex（本番デプロイ）

```bash
npx convex login                 # ブラウザで Convex にログイン（初回だけ）
npx convex dev --configure new   # プロジェクトを作る（開発用デプロイも作られる）
npx convex deploy --yes          # 本番デプロイを作る
```

Convex のダッシュボードで本番デプロイの `.convex.cloud` と `.convex.site` のアドレスを控えておきます。

## 3. Google ログイン（OAuth クライアント）

Google Cloud コンソールで:

1. プロジェクトを作る（または既存のものを使う）
2. 「Google Auth Platform」→ ブランディングでアプリ名（もかるな ポートフォリオ）を入れる。対象は「外部」。ログインするのは自分だけなので、「テスト中」のままテストユーザーに自分のアドレスを足すだけでよい
3. 「クライアント」→ 種類「ウェブ アプリケーション」で作り、承認済みのリダイレクト URI に次の2つを入れる
   - `http://localhost:3000/api/auth/callback/google`
   - `https://mocaluna-portfolio.vercel.app/api/auth/callback/google`
4. クライアント ID とシークレットを控える

## 4. Turnstile と Resend

- Cloudflare のダッシュボード → Turnstile → ウィジェットを追加。ホスト名に `mocaluna-portfolio.vercel.app` と `localhost`。サイトキーとシークレットキーを控える
- Resend に登録し、通知を受け取る自分のメールアドレスを確認する。API キーを「送信のみ」の権限で作る

## 5. 本番の環境変数（Convex）

`scripts/set-prod-env.sh` を実行すると、値を1つずつ聞いて `npx convex env set --prod` で入れます（秘密の値は画面に出ません）。

```bash
./scripts/set-prod-env.sh
```

入る変数: `BETTER_AUTH_SECRET`（自動生成）、`SITE_URL`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`ADMIN_EMAILS`、`IMPORT_FORBIDDEN_STRINGS`、`REVALIDATE_SECRET`（自動生成。最後に表示されるので Vercel にも入れる）、`TURNSTILE_SECRET_KEY`、`RESEND_API_KEY`、`CONTACT_TO_EMAIL`。

**`ALLOW_PASSWORD_AUTH` は本番に入れない**（入れるとメールアドレスとパスワードでのログインが開く。管理者のアドレス以外は作れないが、Google ログインだけにしておく）。

## 6. Vercel

1. Convex のダッシュボード → 本番デプロイ → Settings → Deploy Keys で、権限 `deployment:deploy` だけの鍵を作る
2. Vercel で GitHub のリポジトリを読み込んでプロジェクトを作る。プロジェクト名は `mocaluna-portfolio`（URL がこれで決まる）
3. 環境変数（Production）に次を入れる
   - `CONVEX_DEPLOY_KEY`（1 の鍵）
   - `NEXT_PUBLIC_CONVEX_SITE_URL`（本番の `.convex.site` のアドレス）
   - `NEXT_PUBLIC_SITE_URL` = `https://mocaluna-portfolio.vercel.app`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`（Turnstile のサイトキー）
   - `REVALIDATE_SECRET`（5 で表示された値）
4. デプロイする。ビルドは `vercel.json` の `npx convex deploy --cmd 'pnpm build'` で、Convex の関数を先に出してからサイトを作る。`NEXT_PUBLIC_CONVEX_URL` はこのとき自動で入る

> **`SITE_URL` は Vercel に入れない。** Convex だけに置く変数で、Vercel 側にあると Google ログインのコールバックが黙って失敗する。

## 7. 作品を入れる

```bash
npx convex run --prod seed:run
npx convex run --prod importWork:importAll
```

取り込みの進み具合は Convex のダッシュボードの `importRuns` か、管理画面で見られます。取り込みが終わると、公開ページは自動で作り直されます。

## 8. 確かめる

- `https://mocaluna-portfolio.vercel.app` に6作品が出て、作品ページで画像・動画・目次が動く
- `/login0117` から自分の Google アカウントでログインでき、`/admin` が開く
- 別の Google アカウントではログインできない（「管理者だけ」と出る）
- 管理画面で作品の並び順を変えると、数秒でトップの並びも変わる
- お問い合わせを1通送ると、自分のメールと `/admin/messages` に届く
- 作品ページのソースに本名が出ていない: `curl -s https://mocaluna-portfolio.vercel.app/works/memoca | grep -c "<本名>"` が 0
