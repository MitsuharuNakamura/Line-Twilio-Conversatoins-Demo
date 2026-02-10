# Cloud Run デプロイ手順

## 前提条件

- Google Cloud SDK (`gcloud`) がインストールされていること
- Google Cloud プロジェクトが作成されていること
- Cloud Run APIが有効化されていること

## 環境変数の設定

Cloud Runにデプロイする前に、以下の環境変数を設定する必要があります：

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## デプロイコマンド

packages/middlewareディレクトリで以下のコマンドを実行：

```bash
gcloud run deploy line-twilio-chat-middleware \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN},LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET},TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID},TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN},TWILIO_API_KEY_SID=${TWILIO_API_KEY_SID},TWILIO_API_KEY_SECRET=${TWILIO_API_KEY_SECRET},TWILIO_CONVERSATIONS_SERVICE_SID=${TWILIO_CONVERSATIONS_SERVICE_SID}"
```

または、環境変数を別ファイルで管理する場合：

```bash
# env.yaml を作成
LINE_CHANNEL_ACCESS_TOKEN: your_line_channel_access_token
LINE_CHANNEL_SECRET: your_line_channel_secret
TWILIO_ACCOUNT_SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID: SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID: ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# デプロイ
gcloud run deploy line-twilio-chat-middleware \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --env-vars-file=env.yaml
```

## デプロイ後の確認

デプロイが完了すると、Cloud RunのURLが表示されます：

```
Service [line-twilio-chat-middleware] revision [line-twilio-chat-middleware-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://line-twilio-chat-middleware-xxxxx-an.a.run.app
```

ヘルスチェック：

```bash
curl https://your-service-url.a.run.app/health
```

## LINE Webhook URLの更新

LINEの管理画面で、Webhook URLを以下のように更新します：

```
https://your-service-url.a.run.app/webhook/line
```

## Twilio Webhook URLの更新

Twilio Conversationsの管理画面で、Webhook URLを以下のように更新します：

```
https://your-service-url.a.run.app/webhook/conversations
```

## ログの確認

```bash
gcloud run logs read line-twilio-chat-middleware --region asia-northeast1
```

## 環境変数の更新

デプロイ後に環境変数を更新する場合：

```bash
gcloud run services update line-twilio-chat-middleware \
  --region asia-northeast1 \
  --update-env-vars="TWILIO_API_KEY_SID=new_value"
```
