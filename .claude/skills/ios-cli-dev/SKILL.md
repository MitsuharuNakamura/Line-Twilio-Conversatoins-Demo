---
name: ios-cli-dev
description: Xcode GUIを使わずにCLIだけでiOSアプリを設計・開発・ビルド・テストするスキル。xcodebuild、xcrun simctl、swift CLIを使用。「iOSアプリを作って」「CLIでiOS開発」「Xcodeを開かずにiOSアプリ」「シミュレータでテスト」などのリクエストで使用。
---

# iOS CLI Development

Xcodeを開かずにコマンドラインだけでiOSアプリを開発するためのスキル。

## ワークフロー

```
1. プロジェクト作成 → 2. コード実装 → 3. ビルド → 4. シミュレータ起動 → 5. インストール・実行 → 6. テスト
```

## 1. プロジェクト作成

### SwiftPMベース（推奨：シンプルなアプリ向け）

```bash
mkdir MyApp && cd MyApp
swift package init --type executable --name MyApp
```

### Xcodeプロジェクト生成（UIKit/SwiftUI向け）

`scripts/create_ios_project.sh` を使用:

```bash
./scripts/create_ios_project.sh MyApp com.example.myapp
```

生成される構造:
```
MyApp/
├── MyApp.xcodeproj/
│   └── project.pbxproj
├── MyApp/
│   ├── Info.plist
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   └── ContentView.swift (SwiftUI) または ViewController.swift (UIKit)
└── MyAppTests/
```

## 2. ビルド

### デバッグビルド

```bash
xcodebuild -project MyApp.xcodeproj \
  -scheme MyApp \
  -sdk iphonesimulator \
  -configuration Debug \
  -derivedDataPath build \
  build
```

### リリースビルド

```bash
xcodebuild -project MyApp.xcodeproj \
  -scheme MyApp \
  -sdk iphonesimulator \
  -configuration Release \
  -derivedDataPath build \
  build
```

### ビルド結果の場所

```
build/Build/Products/Debug-iphonesimulator/MyApp.app
```

## 3. シミュレータ操作

### 利用可能なシミュレータ一覧

```bash
xcrun simctl list devices available
```

### シミュレータ起動

```bash
# デバイスIDで起動
xcrun simctl boot <device-id>

# または名前で起動（例: iPhone 15 Pro）
xcrun simctl boot "iPhone 15 Pro"
```

### シミュレータUIを表示

```bash
open -a Simulator
```

### アプリインストール

```bash
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/MyApp.app
```

### アプリ起動

```bash
xcrun simctl launch booted com.example.myapp
```

### シミュレータ終了

```bash
xcrun simctl shutdown booted
```

## 4. テスト実行

### ユニットテスト

```bash
xcodebuild test \
  -project MyApp.xcodeproj \
  -scheme MyApp \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -derivedDataPath build
```

### テスト結果の確認

```bash
# xcresultファイルから結果を抽出
xcrun xcresulttool get --path build/Logs/Test/*.xcresult --format json
```

## 5. 便利なコマンド

### ログ確認

```bash
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.example.myapp"'
```

### スクリーンショット

```bash
xcrun simctl io booted screenshot screenshot.png
```

### 動画録画

```bash
xcrun simctl io booted recordVideo video.mp4
# Ctrl+Cで停止
```

### アプリアンインストール

```bash
xcrun simctl uninstall booted com.example.myapp
```

### シミュレータリセット

```bash
xcrun simctl erase booted
```

## トラブルシューティング

### "No schemes found" エラー

```bash
# スキーム一覧確認
xcodebuild -list -project MyApp.xcodeproj

# スキームがない場合は共有スキームを作成
xcodebuild -project MyApp.xcodeproj -scheme MyApp -showBuildSettings
```

### Signing関連エラー

シミュレータビルドではコード署名不要:

```bash
xcodebuild ... CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

### Module not found エラー

```bash
# DerivedDataをクリア
rm -rf build/
xcodebuild clean -project MyApp.xcodeproj -scheme MyApp
```

## リファレンス

- **プロジェクトテンプレート詳細**: `references/project_templates.md`
- **xcodebuild全オプション**: `references/xcodebuild_options.md`
- **simctl全コマンド**: `references/simctl_commands.md`
