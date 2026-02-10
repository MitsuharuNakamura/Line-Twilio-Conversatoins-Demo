#!/bin/bash
# iOS Project Generator - Creates a minimal iOS project without Xcode GUI
# Usage: ./create_ios_project.sh <ProjectName> <BundleIdentifier> [--swiftui|--uikit]

set -e

PROJECT_NAME="${1:-MyApp}"
BUNDLE_ID="${2:-com.example.myapp}"
UI_FRAMEWORK="${3:---swiftui}"

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 <ProjectName> <BundleIdentifier> [--swiftui|--uikit]"
    echo ""
    echo "Examples:"
    echo "  $0 MyApp com.example.myapp"
    echo "  $0 MyApp com.example.myapp --uikit"
    exit 0
fi

echo "Creating iOS project: $PROJECT_NAME"
echo "Bundle ID: $BUNDLE_ID"
echo "UI Framework: $UI_FRAMEWORK"

# Create directory structure
mkdir -p "$PROJECT_NAME/$PROJECT_NAME"
mkdir -p "$PROJECT_NAME/${PROJECT_NAME}Tests"
mkdir -p "$PROJECT_NAME/$PROJECT_NAME.xcodeproj"

# Generate Info.plist
cat > "$PROJECT_NAME/$PROJECT_NAME/Info.plist" << 'PLIST'
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
PLIST

# Generate AppDelegate.swift
cat > "$PROJECT_NAME/$PROJECT_NAME/AppDelegate.swift" << 'SWIFT'
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
SWIFT

# Generate SceneDelegate.swift based on UI framework
if [ "$UI_FRAMEWORK" == "--swiftui" ]; then
    cat > "$PROJECT_NAME/$PROJECT_NAME/SceneDelegate.swift" << 'SWIFT'
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
SWIFT

    # Generate ContentView.swift for SwiftUI
    cat > "$PROJECT_NAME/$PROJECT_NAME/ContentView.swift" << 'SWIFT'
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
SWIFT

else
    cat > "$PROJECT_NAME/$PROJECT_NAME/SceneDelegate.swift" << 'SWIFT'
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
    }
}
SWIFT

    # Generate ViewController.swift for UIKit
    cat > "$PROJECT_NAME/$PROJECT_NAME/ViewController.swift" << 'SWIFT'
import UIKit

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        
        let label = UILabel()
        label.text = "Hello, World!"
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
}
SWIFT
fi

# Generate test file
cat > "$PROJECT_NAME/${PROJECT_NAME}Tests/${PROJECT_NAME}Tests.swift" << SWIFT
import XCTest
@testable import $PROJECT_NAME

final class ${PROJECT_NAME}Tests: XCTestCase {
    func testExample() throws {
        XCTAssertTrue(true)
    }
}
SWIFT

# Generate project.pbxproj
# This is a minimal but valid Xcode project file
PROJECT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
MAIN_GROUP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
SOURCES_GROUP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TESTS_GROUP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
PRODUCTS_GROUP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
APP_TARGET_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TEST_TARGET_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
APP_PRODUCT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TEST_PRODUCT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONFIG_LIST_PROJECT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONFIG_LIST_APP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONFIG_LIST_TEST_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
DEBUG_PROJECT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
RELEASE_PROJECT_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
DEBUG_APP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
RELEASE_APP_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
DEBUG_TEST_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
RELEASE_TEST_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
SOURCES_PHASE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
FRAMEWORKS_PHASE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
RESOURCES_PHASE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TEST_SOURCES_PHASE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TEST_FRAMEWORKS_PHASE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
APPDELEGATE_FILE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
SCENEDELEGATE_FILE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONTENTVIEW_FILE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
INFOPLIST_FILE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TESTFILE_FILE_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
APPDELEGATE_BUILD_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
SCENEDELEGATE_BUILD_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONTENTVIEW_BUILD_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TESTFILE_BUILD_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
TARGET_DEPENDENCY_UUID=$(uuidgen | tr -d '-' | cut -c1-24)
CONTAINER_PROXY_UUID=$(uuidgen | tr -d '-' | cut -c1-24)

if [ "$UI_FRAMEWORK" == "--swiftui" ]; then
    MAIN_VIEW_NAME="ContentView.swift"
else
    MAIN_VIEW_NAME="ViewController.swift"
fi

cat > "$PROJECT_NAME/$PROJECT_NAME.xcodeproj/project.pbxproj" << PBXPROJ
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
		${APPDELEGATE_BUILD_UUID} /* AppDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${APPDELEGATE_FILE_UUID} /* AppDelegate.swift */; };
		${SCENEDELEGATE_BUILD_UUID} /* SceneDelegate.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${SCENEDELEGATE_FILE_UUID} /* SceneDelegate.swift */; };
		${CONTENTVIEW_BUILD_UUID} /* ${MAIN_VIEW_NAME} in Sources */ = {isa = PBXBuildFile; fileRef = ${CONTENTVIEW_FILE_UUID} /* ${MAIN_VIEW_NAME} */; };
		${TESTFILE_BUILD_UUID} /* ${PROJECT_NAME}Tests.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${TESTFILE_FILE_UUID} /* ${PROJECT_NAME}Tests.swift */; };
/* End PBXBuildFile section */

/* Begin PBXContainerItemProxy section */
		${CONTAINER_PROXY_UUID} /* PBXContainerItemProxy */ = {
			isa = PBXContainerItemProxy;
			containerPortal = ${PROJECT_UUID} /* Project object */;
			proxyType = 1;
			remoteGlobalIDString = ${APP_TARGET_UUID};
			remoteInfo = ${PROJECT_NAME};
		};
/* End PBXContainerItemProxy section */

/* Begin PBXFileReference section */
		${APP_PRODUCT_UUID} /* ${PROJECT_NAME}.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = ${PROJECT_NAME}.app; sourceTree = BUILT_PRODUCTS_DIR; };
		${APPDELEGATE_FILE_UUID} /* AppDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppDelegate.swift; sourceTree = "<group>"; };
		${SCENEDELEGATE_FILE_UUID} /* SceneDelegate.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = SceneDelegate.swift; sourceTree = "<group>"; };
		${CONTENTVIEW_FILE_UUID} /* ${MAIN_VIEW_NAME} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${MAIN_VIEW_NAME}; sourceTree = "<group>"; };
		${INFOPLIST_FILE_UUID} /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
		${TEST_PRODUCT_UUID} /* ${PROJECT_NAME}Tests.xctest */ = {isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = ${PROJECT_NAME}Tests.xctest; sourceTree = BUILT_PRODUCTS_DIR; };
		${TESTFILE_FILE_UUID} /* ${PROJECT_NAME}Tests.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${PROJECT_NAME}Tests.swift; sourceTree = "<group>"; };
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		${FRAMEWORKS_PHASE_UUID} /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		${TEST_FRAMEWORKS_PHASE_UUID} /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		${MAIN_GROUP_UUID} = {
			isa = PBXGroup;
			children = (
				${SOURCES_GROUP_UUID} /* ${PROJECT_NAME} */,
				${TESTS_GROUP_UUID} /* ${PROJECT_NAME}Tests */,
				${PRODUCTS_GROUP_UUID} /* Products */,
			);
			sourceTree = "<group>";
		};
		${PRODUCTS_GROUP_UUID} /* Products */ = {
			isa = PBXGroup;
			children = (
				${APP_PRODUCT_UUID} /* ${PROJECT_NAME}.app */,
				${TEST_PRODUCT_UUID} /* ${PROJECT_NAME}Tests.xctest */,
			);
			name = Products;
			sourceTree = "<group>";
		};
		${SOURCES_GROUP_UUID} /* ${PROJECT_NAME} */ = {
			isa = PBXGroup;
			children = (
				${APPDELEGATE_FILE_UUID} /* AppDelegate.swift */,
				${SCENEDELEGATE_FILE_UUID} /* SceneDelegate.swift */,
				${CONTENTVIEW_FILE_UUID} /* ${MAIN_VIEW_NAME} */,
				${INFOPLIST_FILE_UUID} /* Info.plist */,
			);
			path = ${PROJECT_NAME};
			sourceTree = "<group>";
		};
		${TESTS_GROUP_UUID} /* ${PROJECT_NAME}Tests */ = {
			isa = PBXGroup;
			children = (
				${TESTFILE_FILE_UUID} /* ${PROJECT_NAME}Tests.swift */,
			);
			path = ${PROJECT_NAME}Tests;
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		${APP_TARGET_UUID} /* ${PROJECT_NAME} */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = ${CONFIG_LIST_APP_UUID} /* Build configuration list for PBXNativeTarget "${PROJECT_NAME}" */;
			buildPhases = (
				${SOURCES_PHASE_UUID} /* Sources */,
				${FRAMEWORKS_PHASE_UUID} /* Frameworks */,
				${RESOURCES_PHASE_UUID} /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = ${PROJECT_NAME};
			productName = ${PROJECT_NAME};
			productReference = ${APP_PRODUCT_UUID} /* ${PROJECT_NAME}.app */;
			productType = "com.apple.product-type.application";
		};
		${TEST_TARGET_UUID} /* ${PROJECT_NAME}Tests */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = ${CONFIG_LIST_TEST_UUID} /* Build configuration list for PBXNativeTarget "${PROJECT_NAME}Tests" */;
			buildPhases = (
				${TEST_SOURCES_PHASE_UUID} /* Sources */,
				${TEST_FRAMEWORKS_PHASE_UUID} /* Frameworks */,
			);
			buildRules = (
			);
			dependencies = (
				${TARGET_DEPENDENCY_UUID} /* PBXTargetDependency */,
			);
			name = ${PROJECT_NAME}Tests;
			productName = ${PROJECT_NAME}Tests;
			productReference = ${TEST_PRODUCT_UUID} /* ${PROJECT_NAME}Tests.xctest */;
			productType = "com.apple.product-type.bundle.unit-test";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		${PROJECT_UUID} /* Project object */ = {
			isa = PBXProject;
			attributes = {
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
				TargetAttributes = {
					${APP_TARGET_UUID} = {
						CreatedOnToolsVersion = 15.0;
					};
					${TEST_TARGET_UUID} = {
						CreatedOnToolsVersion = 15.0;
						TestTargetID = ${APP_TARGET_UUID};
					};
				};
			};
			buildConfigurationList = ${CONFIG_LIST_PROJECT_UUID} /* Build configuration list for PBXProject "${PROJECT_NAME}" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = ${MAIN_GROUP_UUID};
			productRefGroup = ${PRODUCTS_GROUP_UUID} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				${APP_TARGET_UUID} /* ${PROJECT_NAME} */,
				${TEST_TARGET_UUID} /* ${PROJECT_NAME}Tests */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		${RESOURCES_PHASE_UUID} /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		${SOURCES_PHASE_UUID} /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				${CONTENTVIEW_BUILD_UUID} /* ${MAIN_VIEW_NAME} in Sources */,
				${APPDELEGATE_BUILD_UUID} /* AppDelegate.swift in Sources */,
				${SCENEDELEGATE_BUILD_UUID} /* SceneDelegate.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
		${TEST_SOURCES_PHASE_UUID} /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				${TESTFILE_BUILD_UUID} /* ${PROJECT_NAME}Tests.swift in Sources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin PBXTargetDependency section */
		${TARGET_DEPENDENCY_UUID} /* PBXTargetDependency */ = {
			isa = PBXTargetDependency;
			target = ${APP_TARGET_UUID} /* ${PROJECT_NAME} */;
			targetProxy = ${CONTAINER_PROXY_UUID} /* PBXContainerItemProxy */;
		};
/* End PBXTargetDependency section */

/* Begin XCBuildConfiguration section */
		${DEBUG_PROJECT_UUID} /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"\$(inherited)",
				);
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				MTL_FAST_MATH = YES;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG \$(inherited)";
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			};
			name = Debug;
		};
		${RELEASE_PROJECT_UUID} /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;
				CLANG_ANALYZER_NONNULL = YES;
				CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
				CLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				CLANG_ENABLE_OBJC_WEAK = YES;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				CLANG_WARN_COMMA = YES;
				CLANG_WARN_CONSTANT_CONVERSION = YES;
				CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES;
				CLANG_WARN_DIRECT_OBJC_ISA_USAGE = YES_ERROR;
				CLANG_WARN_DOCUMENTATION_COMMENTS = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_ENUM_CONVERSION = YES;
				CLANG_WARN_INFINITE_RECURSION = YES;
				CLANG_WARN_INT_CONVERSION = YES;
				CLANG_WARN_NON_LITERAL_NULL_CONVERSION = YES;
				CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF = YES;
				CLANG_WARN_OBJC_LITERAL_CONVERSION = YES;
				CLANG_WARN_OBJC_ROOT_CLASS = YES_ERROR;
				CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;
				CLANG_WARN_RANGE_LOOP_ANALYSIS = YES;
				CLANG_WARN_STRICT_PROTOTYPES = YES;
				CLANG_WARN_SUSPICIOUS_MOVE = YES;
				CLANG_WARN_UNGUARDED_AVAILABILITY = YES_AGGRESSIVE;
				CLANG_WARN_UNREACHABLE_CODE = YES;
				CLANG_WARN__DUPLICATE_METHOD_MATCH = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_USER_SCRIPT_SANDBOXING = YES;
				GCC_C_LANGUAGE_STANDARD = gnu17;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_WARN_64_TO_32_BIT_CONVERSION = YES;
				GCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
				GCC_WARN_UNDECLARED_SELECTOR = YES;
				GCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
				GCC_WARN_UNUSED_FUNCTION = YES;
				GCC_WARN_UNUSED_VARIABLE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				LOCALIZATION_PREFERS_STRING_CATALOGS = YES;
				MTL_ENABLE_DEBUG_INFO = NO;
				MTL_FAST_MATH = YES;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				VALIDATE_PRODUCT = YES;
			};
			name = Release;
		};
		${DEBUG_APP_UUID} /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = ${PROJECT_NAME}/Info.plist;
				INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				LD_RUNPATH_SEARCH_PATHS = (
					"\$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};
				PRODUCT_NAME = "\$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Debug;
		};
		${RELEASE_APP_UUID} /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = ${PROJECT_NAME}/Info.plist;
				INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
				LD_RUNPATH_SEARCH_PATHS = (
					"\$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};
				PRODUCT_NAME = "\$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Release;
		};
		${DEBUG_TEST_UUID} /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "\$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "${BUNDLE_ID}Tests";
				PRODUCT_NAME = "\$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = NO;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
				TEST_HOST = "\$(BUILT_PRODUCTS_DIR)/${PROJECT_NAME}.app/\$(BUNDLE_EXECUTABLE_FOLDER_PATH)/${PROJECT_NAME}";
			};
			name = Debug;
		};
		${RELEASE_TEST_UUID} /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				BUNDLE_LOADER = "\$(TEST_HOST)";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				GENERATE_INFOPLIST_FILE = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				MARKETING_VERSION = 1.0;
				PRODUCT_BUNDLE_IDENTIFIER = "${BUNDLE_ID}Tests";
				PRODUCT_NAME = "\$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = NO;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
				TEST_HOST = "\$(BUILT_PRODUCTS_DIR)/${PROJECT_NAME}.app/\$(BUNDLE_EXECUTABLE_FOLDER_PATH)/${PROJECT_NAME}";
			};
			name = Release;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		${CONFIG_LIST_PROJECT_UUID} /* Build configuration list for PBXProject "${PROJECT_NAME}" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				${DEBUG_PROJECT_UUID} /* Debug */,
				${RELEASE_PROJECT_UUID} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		${CONFIG_LIST_APP_UUID} /* Build configuration list for PBXNativeTarget "${PROJECT_NAME}" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				${DEBUG_APP_UUID} /* Debug */,
				${RELEASE_APP_UUID} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		${CONFIG_LIST_TEST_UUID} /* Build configuration list for PBXNativeTarget "${PROJECT_NAME}Tests" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				${DEBUG_TEST_UUID} /* Debug */,
				${RELEASE_TEST_UUID} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
/* End XCConfigurationList section */
	};
	rootObject = ${PROJECT_UUID} /* Project object */;
}
PBXPROJ

# Create scheme
mkdir -p "$PROJECT_NAME/$PROJECT_NAME.xcodeproj/xcshareddata/xcschemes"
cat > "$PROJECT_NAME/$PROJECT_NAME.xcodeproj/xcshareddata/xcschemes/$PROJECT_NAME.xcscheme" << SCHEME
<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1500"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${APP_TARGET_UUID}"
               BuildableName = "${PROJECT_NAME}.app"
               BlueprintName = "${PROJECT_NAME}"
               ReferencedContainer = "container:${PROJECT_NAME}.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestPlan = "YES">
      <Testables>
         <TestableReference
            skipped = "NO"
            parallelizable = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${TEST_TARGET_UUID}"
               BuildableName = "${PROJECT_NAME}Tests.xctest"
               BlueprintName = "${PROJECT_NAME}Tests"
               ReferencedContainer = "container:${PROJECT_NAME}.xcodeproj">
            </BuildableReference>
         </TestableReference>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${APP_TARGET_UUID}"
            BuildableName = "${PROJECT_NAME}.app"
            BlueprintName = "${PROJECT_NAME}"
            ReferencedContainer = "container:${PROJECT_NAME}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${APP_TARGET_UUID}"
            BuildableName = "${PROJECT_NAME}.app"
            BlueprintName = "${PROJECT_NAME}"
            ReferencedContainer = "container:${PROJECT_NAME}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
SCHEME

echo ""
echo "✅ iOS project created successfully!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  xcodebuild -project $PROJECT_NAME.xcodeproj -scheme $PROJECT_NAME -sdk iphonesimulator -configuration Debug -derivedDataPath build build"
echo "  xcrun simctl boot 'iPhone 15 Pro'"
echo "  xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/$PROJECT_NAME.app"
echo "  xcrun simctl launch booted $BUNDLE_ID"
