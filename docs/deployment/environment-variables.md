# 環境変数管理とデプロイガイド

## 概要

このドキュメントでは、Vercel（Web UI）とGoogle Cloud Run（ミドルウェア）へのデプロイ時の環境変数管理のベストプラクティスを説明します。

**重要な教訓**: 環境変数に**改行文字や余分な空白が含まれると、JWT生成やAPI認証が失敗**します。このドキュメントの手順に従うことで、これらの問題を回避できます。

## 環境変数の基本原則

### 1. 改行文字を絶対に含めない

❌ **間違い**:
```bash
echo "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add TWILIO_API_KEY
# または
cat file.txt | vercel env add VARIABLE_NAME
```

✅ **正しい**:
```bash
# Vercelダッシュボードで手動入力
# または
printf '%s' "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add TWILIO_API_KEY
```

### 2. コピー&ペースト時の注意

- テキストエディタからコピーする際、**末尾の改行を含めない**
- 値の前後に**スペースがないか確認**
- 可能な限り**Vercel/Google Cloud Consoleで直接入力**

### 3. 検証方法

設定後、必ず以下で検証:

```bash
# Vercel
vercel env pull .env.vercel.local
cat .env.vercel.local  # 改行やスペースがないか確認

# Google Cloud Run
gcloud run services describe SERVICE_NAME --region REGION --format="value(spec.template.spec.containers[0].env)"
```

## Vercelデプロイガイド

### 必要な環境変数

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDDLEWARE_URL=https://your-middleware.run.app
AUTH_SECRET=your-strong-random-secret-min-32-chars
```

### 推奨デプロイ手順

#### ステップ1: 初回デプロイ（環境変数なし）

```bash
# プロジェクトルートから
cd /path/to/project
vercel
```

これで、Vercelプロジェクトがリンクされます。

#### ステップ2: Vercelダッシュボードで環境変数を設定（推奨）

1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 各変数を**手動で入力**:
   - Variable Name: `TWILIO_ACCOUNT_SID`
   - Value: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`（改行なし）
   - Environment: `Production`, `Preview`, `Development` すべてにチェック
5. **Add** をクリック
6. すべての環境変数について繰り返し

**重要**:
- 値を入力する際、**Enter キーを押さない**（自動で改行が入る可能性）
- コピー&ペースト後、**カーソルで末尾を確認**

#### ステップ3: 本番デプロイ

```bash
vercel --prod
```

### CLI経由での設定（上級者向け）

どうしてもCLIで設定したい場合:

```bash
# 安全な方法: printf を使用
printf '%s' "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add TWILIO_ACCOUNT_SID production

# または、ファイルから読み込む場合は tr で改行を削除
cat secret.txt | tr -d '\n' | vercel env add TWILIO_API_KEY_SECRET production
```

### トラブルシューティング: Vercel

#### 問題: JWT生成エラー

**症状**:
```
Error: Invalid JWT token
ConversationClient initialization failed
```

**原因**: 環境変数に改行文字 (`\n`) や `N` が含まれている

**解決策**:
1. Vercelダッシュボードで該当する環境変数を開く
2. 値をコピーしてテキストエディタに貼り付け
3. 改行や余分な文字がないか確認
4. 問題があれば、再度手動で入力し直す
5. `vercel --prod` で再デプロイ

#### 問題: 環境変数が反映されない

**解決策**:
```bash
# 最新の環境変数をプルして確認
vercel env pull .env.vercel.local
cat .env.vercel.local

# 再デプロイ
vercel --prod --force
```

## Google Cloud Run デプロイガイド（ソースコードデプロイ）

### 必要な環境変数

```
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 推奨デプロイ手順（ソースコードデプロイ）

Cloud Runは**ソースコードから直接デプロイ**できます。Dockerfileは不要です。

#### 前提条件

1. Google Cloud CLIインストール済み
2. プロジェクトIDを設定済み

```bash
gcloud config set project YOUR_PROJECT_ID
```

#### ステップ1: 必要なAPIを有効化

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

#### ステップ2: プロジェクト構造の準備

ソースコードデプロイでは、Cloud Buildが自動的にビルドパックを検出します。

**必要なファイル**:

1. `packages/middleware/package.json`:
```json
{
  "name": "@line-twilio-chat/middleware",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

2. `.gcloudignore` (プロジェクトルート):
```
# Node.js
node_modules/
npm-debug.log

# 開発ファイル
.env
.env.*
!.env.production
.dev.vars

# TypeScript
*.ts
!src/**/*.ts
tsconfig.json

# ビルド済みファイル（再ビルドするため）
dist/

# その他のパッケージ
packages/web-ui/
packages/shared/src/

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
```

3. `cloudbuild.yaml` (プロジェクトルート):
```yaml
steps:
  # 依存関係インストール
  - name: 'node:20'
    entrypoint: npm
    args: ['install', '-g', 'pnpm@latest']

  - name: 'node:20'
    entrypoint: pnpm
    args: ['install']

  # TypeScriptビルド
  - name: 'node:20'
    entrypoint: pnpm
    args: ['--filter', '@line-twilio-chat/middleware', 'build']

  # Cloud Runにデプロイ
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'line-twilio-chat-middleware'
      - '--source=packages/middleware'
      - '--platform=managed'
      - '--region=asia-northeast1'
      - '--allow-unauthenticated'
      - '--set-env-vars=NODE_ENV=production'

options:
  logging: CLOUD_LOGGING_ONLY
```

#### ステップ3: 環境変数ファイルの準備

**重要**: CLIでの `--set-env-vars` は値が長いとエラーになるため、YAMLファイルを使用します。

`env.yaml` (プロジェクトルートに作成、**.gitignore に追加**):

```yaml
LINE_CHANNEL_ACCESS_TOKEN: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
LINE_CHANNEL_SECRET: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SID: "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SECRET: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_CONVERSATIONS_SERVICE_SID: "ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NODE_ENV: "production"
```

**注意事項**:
- YAMLでは値を**ダブルクォートで囲む**
- 改行は含めない
- ファイルを必ず `.gitignore` に追加

#### ステップ4: ソースコードデプロイ

```bash
# プロジェクトルートから実行
cd /path/to/project

# ビルド＆デプロイ
gcloud builds submit --config cloudbuild.yaml

# 環境変数を設定
gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --env-vars-file env.yaml
```

または、**一発デプロイ**（簡易版）:

```bash
cd packages/middleware

# 先にビルド
pnpm build

# ソースからデプロイ
gcloud run deploy line-twilio-chat-middleware \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --env-vars-file ../../env.yaml
```

#### ステップ5: デプロイ確認

```bash
# サービス情報確認
gcloud run services describe line-twilio-chat-middleware \
  --region asia-northeast1

# URLを取得
gcloud run services describe line-twilio-chat-middleware \
  --region asia-northeast1 \
  --format='value(status.url)'

# ログ確認
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=line-twilio-chat-middleware"
```

### Google Cloud Console経由での環境変数設定（最も推奨）

1. https://console.cloud.google.com/run にアクセス
2. サービス `line-twilio-chat-middleware` をクリック
3. **EDIT & DEPLOY NEW REVISION** をクリック
4. **Variables & Secrets** タブを開く
5. **+ ADD VARIABLE** をクリック
6. 各環境変数を手動入力:
   - Name: `LINE_CHANNEL_ACCESS_TOKEN`
   - Value: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
7. すべての変数を追加後、**DEPLOY** をクリック

**メリット**:
- GUIで直感的に設定
- 改行文字の混入リスクが最も低い
- Secret Manager との連携も簡単

### トラブルシューティング: Google Cloud Run

#### 問題: ビルドエラー "dist directory not found"

**原因**: TypeScriptがコンパイルされていない

**解決策**:
1. `packages/middleware/tsconfig.json` で `noEmit: false` を確認
2. `pnpm --filter middleware build` でローカルビルド確認
3. `.gcloudignore` で `dist/` が除外されていないか確認

#### 問題: "Cannot find module" エラー

**原因**: ES Modules対応が不完全

**解決策**:
```bash
# 相対importに .js 拡張子を追加
cd packages/middleware
find src -name "*.ts" -type f -exec sed -i '' -E "s|from '(\.\./[^']+)'|from '\1.js'|g" {} \;

# 再ビルド
pnpm build

# 再デプロイ
gcloud run deploy line-twilio-chat-middleware \
  --source . \
  --region asia-northeast1 \
  --env-vars-file ../../env.yaml
```

#### 問題: 環境変数が反映されない

**解決策**:
```bash
# 環境変数を確認
gcloud run services describe line-twilio-chat-middleware \
  --region asia-northeast1 \
  --format="value(spec.template.spec.containers[0].env)"

# YAMLファイルで再設定
gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --env-vars-file env.yaml

# 新しいリビジョンがデプロイされたか確認
gcloud run revisions list \
  --service line-twilio-chat-middleware \
  --region asia-northeast1
```

## 環境変数の安全な管理

### 開発環境

```bash
# プロジェクトルート
cp .env.example .env.local

# ミドルウェア
cd packages/middleware
cp .dev.vars.example .dev.vars
```

**重要**: `.env.local`, `.dev.vars`, `env.yaml` は `.gitignore` に追加

### 本番環境

1. **Vercel**: Environment Variables（ダッシュボード）
2. **Google Cloud Run**: Secret Manager推奨

#### Secret Managerの使用（推奨）

```bash
# シークレット作成
echo -n "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | \
  gcloud secrets create TWILIO_ACCOUNT_SID --data-file=-

# Cloud Runに設定
gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --update-secrets=TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest

# すべてのシークレットを一括設定
for secret in LINE_CHANNEL_ACCESS_TOKEN LINE_CHANNEL_SECRET TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_API_KEY_SID TWILIO_API_KEY_SECRET TWILIO_CONVERSATIONS_SERVICE_SID; do
  echo "Enter value for $secret:"
  read -s value
  echo -n "$value" | gcloud secrets create $secret --data-file=- || \
  echo -n "$value" | gcloud secrets versions add $secret --data-file=-
done

gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --update-secrets=\
LINE_CHANNEL_ACCESS_TOKEN=LINE_CHANNEL_ACCESS_TOKEN:latest,\
LINE_CHANNEL_SECRET=LINE_CHANNEL_SECRET:latest,\
TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest,\
TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest,\
TWILIO_API_KEY_SID=TWILIO_API_KEY_SID:latest,\
TWILIO_API_KEY_SECRET=TWILIO_API_KEY_SECRET:latest,\
TWILIO_CONVERSATIONS_SERVICE_SID=TWILIO_CONVERSATIONS_SERVICE_SID:latest
```

## デプロイチェックリスト

### Vercel（Web UI）

- [ ] 環境変数をダッシュボードで手動設定
- [ ] すべての変数に改行・スペースがないことを確認
- [ ] `AUTH_SECRET` は32文字以上のランダム文字列
- [ ] `NEXT_PUBLIC_MIDDLEWARE_URL` がCloud Run URLと一致
- [ ] `vercel env pull` で変数確認
- [ ] `vercel --prod` でデプロイ
- [ ] デプロイ後、ログイン画面が表示されることを確認

### Google Cloud Run（ミドルウェア）

- [ ] `env.yaml` を作成し `.gitignore` に追加
- [ ] または Secret Manager を使用
- [ ] `packages/middleware/package.json` の `engines` フィールド確認
- [ ] `pnpm --filter middleware build` でローカルビルド成功確認
- [ ] `.gcloudignore` 設定確認
- [ ] ソースコードデプロイ実行
- [ ] 環境変数を `env.yaml` または Console で設定
- [ ] デプロイ後、Webhook URLが動作することを確認
- [ ] ログで環境変数が読み込まれていることを確認

## まとめ

### 環境変数設定のベストプラクティス

1. **改行文字を絶対に含めない**
2. **Vercel/Google Cloud Consoleで直接入力**（最も安全）
3. **CLIを使う場合は `printf '%s'` を使用**
4. **設定後は必ず検証**
5. **本番環境ではSecret Manager使用を検討**

### デプロイのベストプラクティス

1. **Google Cloud Run: ソースコードデプロイを優先**
   - Dockerfileメンテナンス不要
   - ビルドパック自動検出
   - 環境変数はYAMLまたはConsole

2. **Vercel: ダッシュボードで環境変数設定**
   - CLI設定は改行混入リスクあり
   - 手動入力が最も安全

3. **常にログで検証**
   - デプロイ後は必ずログ確認
   - 環境変数が正しく読み込まれているか確認
