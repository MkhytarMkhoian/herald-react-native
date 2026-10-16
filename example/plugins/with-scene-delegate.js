// iOS 27 stops apps that don't use UIKit's scene life cycle. Expo 57 ships the scene delegate it
// needs, ExpoAppSceneDelegate, but its app template doesn't use it yet. This plugin makes the
// generated iOS project use it: the scene delegate opens the window and starts React Native.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const startInWindow =
  /\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?launchOptions: launchOptions\)\n/;

module.exports = function withSceneDelegate(config) {
  config = withInfoPlist(config, (plist) => {
    plist.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return plist;
  });
  return withAppDelegate(config, (appDelegate) => {
    let source = appDelegate.modResults.contents;
    if (source.includes('ExpoReactNativeFactoryProvider')) return appDelegate;
    if (!startInWindow.test(source) || !source.includes('class AppDelegate: ExpoAppDelegate {')) {
      throw new Error(
        "with-scene-delegate: Expo's AppDelegate template changed. Check whether it adopts " +
          'scenes now, and update or remove this plugin.',
      );
    }
    source = source
      .replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
      )
      .replace(
        startInWindow,
        '\n    // The scene delegate opens the window and starts React Native in it.\n',
      );
    appDelegate.modResults.contents = source;
    return appDelegate;
  });
};
