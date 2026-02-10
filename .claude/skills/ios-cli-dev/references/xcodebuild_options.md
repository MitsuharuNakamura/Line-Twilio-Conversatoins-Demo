# xcodebuild Reference

## 基本構文

```bash
xcodebuild [-project <projectname>] [-target <targetname>] [-configuration <configurationname>]
           [-sdk <sdkname>] [-arch <architecture>] [-derivedDataPath <path>]
           [<buildsetting>=<value>]... [<buildaction>]...
```

## 主要オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `-project` | プロジェクトファイル | `-project MyApp.xcodeproj` |
| `-workspace` | ワークスペース | `-workspace MyApp.xcworkspace` |
| `-scheme` | スキーム名 | `-scheme MyApp` |
| `-target` | ターゲット名 | `-target MyAppTests` |
| `-configuration` | ビルド構成 | `-configuration Debug` or `Release` |
| `-sdk` | SDK | `-sdk iphonesimulator` or `iphoneos` |
| `-destination` | デスティネーション | `-destination 'platform=iOS Simulator,name=iPhone 15'` |
| `-derivedDataPath` | ビルド出力先 | `-derivedDataPath ./build` |
| `-arch` | アーキテクチャ | `-arch arm64` or `x86_64` |

## ビルドアクション

| アクション | 説明 |
|-----------|------|
| `build` | ビルド実行 |
| `clean` | ビルド成果物を削除 |
| `test` | テスト実行 |
| `archive` | アーカイブ作成 |
| `analyze` | 静的解析 |
| `install` | インストール |

## SDK一覧

```bash
# 利用可能なSDK一覧
xcodebuild -showsdks

# 主要なSDK
iphonesimulator    # iOSシミュレータ
iphoneos           # iOS実機
macosx             # macOS
```

## デスティネーション指定

### シミュレータ

```bash
-destination 'platform=iOS Simulator,name=iPhone 15 Pro'
-destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=17.0'
-destination 'platform=iOS Simulator,id=<device-udid>'
```

### 実機

```bash
-destination 'platform=iOS,name=My iPhone'
-destination 'platform=iOS,id=<device-udid>'
```

### 汎用デスティネーション

```bash
-destination 'generic/platform=iOS'
-destination 'generic/platform=iOS Simulator'
```

## ビルド設定オーバーライド

```bash
# コード署名を無効化（シミュレータ用）
CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

# 最適化レベル
SWIFT_OPTIMIZATION_LEVEL="-Onone"  # デバッグ
SWIFT_OPTIMIZATION_LEVEL="-O"      # リリース

# デプロイメントターゲット
IPHONEOS_DEPLOYMENT_TARGET=17.0

# ビルドディレクトリ
CONFIGURATION_BUILD_DIR=./output
```

## よく使うコマンド例

### プロジェクト情報表示

```bash
xcodebuild -list -project MyApp.xcodeproj
```

### クリーンビルド

```bash
xcodebuild clean build -project MyApp.xcodeproj -scheme MyApp \
  -sdk iphonesimulator -configuration Debug
```

### テスト実行（結果をJSONで取得）

```bash
xcodebuild test -project MyApp.xcodeproj -scheme MyApp \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -resultBundlePath ./TestResults.xcresult
```

### 並列ビルド

```bash
xcodebuild -project MyApp.xcodeproj -scheme MyApp \
  -jobs 4  # 並列ジョブ数
```

### ビルド設定の確認

```bash
xcodebuild -showBuildSettings -project MyApp.xcodeproj -scheme MyApp
```

## エラー対応

### "requires a provisioning profile" エラー

```bash
xcodebuild ... CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

### "No provisioning profiles with a valid signing identity" エラー

シミュレータビルドでは署名不要:

```bash
xcodebuild ... -sdk iphonesimulator
```

### スキームが見つからない

```bash
# 共有スキームを作成してから再試行
xcodebuild -list -project MyApp.xcodeproj
```
