# iOS Project Templates Reference

## 1. SwiftUI App (推奨)

最もシンプルな構成。モダンなiOSアプリ向け。

### 構造

```
MyApp/
├── MyApp.xcodeproj/
│   ├── project.pbxproj
│   └── xcshareddata/xcschemes/MyApp.xcscheme
├── MyApp/
│   ├── Info.plist
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   └── ContentView.swift
└── MyAppTests/
    └── MyAppTests.swift
```

### ContentView.swift

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
```

## 2. UIKit App

従来のUIKit構成。Storyboardなし。

### 構造

```
MyApp/
├── MyApp.xcodeproj/
├── MyApp/
│   ├── Info.plist
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   └── ViewController.swift
└── MyAppTests/
```

### ViewController.swift

```swift
import UIKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        setupUI()
    }
    
    private func setupUI() {
        let label = UILabel()
        label.text = "Hello, World!"
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
}
```

## 3. SwiftPM Executable

シンプルなコマンドラインツールやプロトタイプ向け。

### 構造

```
MyApp/
├── Package.swift
├── Sources/
│   └── MyApp/
│       └── main.swift
└── Tests/
    └── MyAppTests/
        └── MyAppTests.swift
```

### Package.swift

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [.iOS(.v17)],
    products: [
        .executable(name: "MyApp", targets: ["MyApp"])
    ],
    targets: [
        .executableTarget(name: "MyApp"),
        .testTarget(name: "MyAppTests", dependencies: ["MyApp"])
    ]
)
```

## 4. Swift Package with iOS Target

ライブラリとアプリを分離した構成。

### Package.swift

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "MyAppCore", targets: ["MyAppCore"])
    ],
    dependencies: [
        // 外部依存関係
    ],
    targets: [
        .target(name: "MyAppCore"),
        .testTarget(name: "MyAppCoreTests", dependencies: ["MyAppCore"])
    ]
)
```

## 必須ファイル詳細

### Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
        <key>UISceneConfigurations</key>
        <dict>
            <key>UIWindowSceneSessionRoleApplication</key>
            <array>
                <dict>
                    <key>UISceneConfigurationName</key>
                    <string>Default Configuration</string>
                    <key>UISceneDelegateClassName</key>
                    <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                </dict>
            </array>
        </dict>
    </dict>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
</dict>
</plist>
```

### AppDelegate.swift

```swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
```

### SceneDelegate.swift (SwiftUI)

```swift
import UIKit
import SwiftUI

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = UIHostingController(rootView: ContentView())
        window?.makeKeyAndVisible()
    }
}
```

## プロジェクト生成コマンド

```bash
# SwiftUI
./scripts/create_ios_project.sh MyApp com.example.myapp --swiftui

# UIKit
./scripts/create_ios_project.sh MyApp com.example.myapp --uikit

# SwiftPM
mkdir MyApp && cd MyApp
swift package init --type executable --name MyApp
```
