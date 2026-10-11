#!/bin/sh
# 本番の Convex デプロイに環境変数を入れる（docs/DEPLOY.md の 5）。
# 秘密の値は入力しても画面に出さない。空のまま Enter を押した項目は入れない。
set -e
cd "$(dirname "$0")/.."

ask() {  # $1: 変数名  $2: 説明  $3: secret なら入力を隠す
    printf '%s（%s）: ' "$1" "$2" >&2
    if [ "$3" = secret ]; then
        stty -echo
        IFS= read -r value
        stty echo
        printf '\n' >&2
    else
        IFS= read -r value
    fi
    printf '%s' "$value"
}

put() {  # $1: 変数名  $2: 値
    [ -n "$2" ] || { echo "  $1 は入れませんでした（空）" >&2; return; }
    npx convex env set --prod "$1" "$2" >/dev/null
    echo "  $1 を入れました" >&2
}

put BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
put SITE_URL "$(ask SITE_URL 'サイトの URL。例 https://mocaluna-portfolio.vercel.app')"
put GOOGLE_CLIENT_ID "$(ask GOOGLE_CLIENT_ID 'Google OAuth クライアント ID')"
put GOOGLE_CLIENT_SECRET "$(ask GOOGLE_CLIENT_SECRET 'Google OAuth クライアント シークレット' secret)"
put ADMIN_EMAILS "$(ask ADMIN_EMAILS 'ログインを許す Google アカウントのメールアドレス')"
put IMPORT_FORBIDDEN_STRINGS "$(ask IMPORT_FORBIDDEN_STRINGS '資料に残っていたら取り込みを止める文字列。カンマ区切り' secret)"
put TURNSTILE_SECRET_KEY "$(ask TURNSTILE_SECRET_KEY 'Turnstile のシークレットキー' secret)"
put RESEND_API_KEY "$(ask RESEND_API_KEY 'Resend の API キー' secret)"
put CONTACT_TO_EMAIL "$(ask CONTACT_TO_EMAIL 'お問い合わせの通知を受け取るメールアドレス')"

revalidate=$(openssl rand -hex 24)
put REVALIDATE_SECRET "$revalidate"
echo >&2
echo "Vercel の環境変数 REVALIDATE_SECRET にも、次の値を入れてください:" >&2
echo "$revalidate"
