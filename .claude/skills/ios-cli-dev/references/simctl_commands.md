# xcrun simctl Reference

シミュレータを操作するためのコマンドラインツール。

## デバイス管理

### デバイス一覧

```bash
# 全デバイス一覧
xcrun simctl list devices

# 利用可能なデバイスのみ
xcrun simctl list devices available

# JSON形式で出力
xcrun simctl list devices -j
```

### デバイス作成

```bash
xcrun simctl create <name> <device-type> <runtime>

# 例
xcrun simctl create "My iPhone" "iPhone 15 Pro" "iOS17.0"
```

### デバイス削除

```bash
xcrun simctl delete <device>
xcrun simctl delete unavailable  # 利用不可なデバイスを全削除
```

## ライフサイクル

### 起動

```bash
xcrun simctl boot <device>
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl boot booted  # すでに起動中のデバイス
```

### シャットダウン

```bash
xcrun simctl shutdown <device>
xcrun simctl shutdown booted
xcrun simctl shutdown all  # 全デバイス
```

### リセット（初期化）

```bash
xcrun simctl erase <device>
xcrun simctl erase booted
xcrun simctl erase all
```

## アプリ操作

### インストール

```bash
xcrun simctl install <device> <path-to-app>
xcrun simctl install booted ./build/MyApp.app
```

### アンインストール

```bash
xcrun simctl uninstall <device> <bundle-id>
xcrun simctl uninstall booted com.example.myapp
```

### 起動

```bash
xcrun simctl launch <device> <bundle-id> [args...]
xcrun simctl launch booted com.example.myapp

# コンソール出力をターミナルに表示
xcrun simctl launch --console booted com.example.myapp

# stdout/stderrをターミナルに表示
xcrun simctl launch --console-pty booted com.example.myapp
```

### 終了

```bash
xcrun simctl terminate <device> <bundle-id>
xcrun simctl terminate booted com.example.myapp
```

### アプリ情報取得

```bash
xcrun simctl get_app_container <device> <bundle-id> [container]
xcrun simctl get_app_container booted com.example.myapp data
```

## メディア・I/O

### スクリーンショット

```bash
xcrun simctl io <device> screenshot <filename>
xcrun simctl io booted screenshot screen.png
xcrun simctl io booted screenshot --type=jpeg screen.jpg
```

### 動画録画

```bash
xcrun simctl io <device> recordVideo <filename>
xcrun simctl io booted recordVideo recording.mp4
# Ctrl+C で停止
```

### 写真・動画追加

```bash
xcrun simctl addmedia <device> <path>
xcrun simctl addmedia booted photo.jpg
xcrun simctl addmedia booted video.mp4
```

## プッシュ通知

```bash
xcrun simctl push <device> <bundle-id> <json-file>

# 例: push.json
{
  "aps": {
    "alert": {
      "title": "Test",
      "body": "Hello World"
    }
  }
}

xcrun simctl push booted com.example.myapp push.json
```

## URL操作

```bash
xcrun simctl openurl <device> <url>
xcrun simctl openurl booted "https://example.com"
xcrun simctl openurl booted "myapp://deeplink/path"
```

## クリップボード

```bash
# ペースト（シミュレータからホストへ）
xcrun simctl pbpaste <device>

# コピー（ホストからシミュレータへ）
xcrun simctl pbcopy <device> < file.txt
echo "text" | xcrun simctl pbcopy booted
```

## ログ・デバッグ

### ログストリーム

```bash
# 全ログ
xcrun simctl spawn <device> log stream

# フィルタリング
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.example.myapp"'
xcrun simctl spawn booted log stream --level error
```

### ログ収集

```bash
xcrun simctl spawn booted log collect --output logs.logarchive
```

### プロセス内でコマンド実行

```bash
xcrun simctl spawn <device> <command> [args...]
xcrun simctl spawn booted defaults read com.example.myapp
```

## 位置情報

```bash
xcrun simctl location <device> set <lat,lng>
xcrun simctl location booted set 35.6812,139.7671  # 東京
xcrun simctl location booted clear
```

## プライバシー設定

```bash
xcrun simctl privacy <device> <action> <service> [bundle-id]

# 許可を与える
xcrun simctl privacy booted grant photos com.example.myapp
xcrun simctl privacy booted grant camera com.example.myapp
xcrun simctl privacy booted grant microphone com.example.myapp
xcrun simctl privacy booted grant location com.example.myapp

# 許可を取り消す
xcrun simctl privacy booted revoke all com.example.myapp

# リセット
xcrun simctl privacy booted reset all
```

## キーチェーン

```bash
xcrun simctl keychain <device> <action>
xcrun simctl keychain booted reset
xcrun simctl keychain booted add-root-cert cert.pem
```

## ステータスバー

```bash
xcrun simctl status_bar <device> override [options]

# 時刻を固定
xcrun simctl status_bar booted override --time "9:41"

# バッテリー表示
xcrun simctl status_bar booted override --batteryState charged --batteryLevel 100

# リセット
xcrun simctl status_bar booted clear
```

## ペアリング（watchOS）

```bash
xcrun simctl pair <watch> <phone>
xcrun simctl pair_activate <pair-id>
xcrun simctl unpair <pair-id>
```

## デバイスタイプ・ランタイム一覧

```bash
xcrun simctl list devicetypes
xcrun simctl list runtimes
```
