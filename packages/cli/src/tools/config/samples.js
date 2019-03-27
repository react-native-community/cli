/**
 * @flow
 *
 * Sample configuration objects that are used for `jest-validate`.
 *
 * See `./types.flow` for explanation of what
 * the properties are responsible for.
 */
import {multipleValidOptions} from 'jest-validate';

import {type UserConfigT, type LegacyDependencyUserConfigT} from './types.flow';

const dependencyConfig = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android/app',
        manifestPath: './path/to/AndroidManifest.xml',
        packageImportPath: 'import com.my.package.MyReactPackage',
        packageInstance: 'new MyReactPackage()',
      },
      ios: {
        project: 'MyProject.xcodeproj',
        sharedLibraries: ['libz'],
        libraryFolder: 'Libraries',
      },
    },
    assets: ['./path/to/asset.png'],
    hooks: {
      prelink: './path/to/a/command.sh',
      postlink: './path/to/a/command.sh',
    },
    params: [
      {
        type: 'input',
        name: 'myKey',
        message: 'What is your deployment key value?',
      },
    ],
  },
  platforms: {
    windows: './platform.js',
  },
  commands: ['./local-cli/runWindows/runWindows.js'],
};

const projectConfig = {
  dependencies: {
    'react-native-webview': {
      root: './path/to/library',
      platforms: {
        ios: {
          sourceDir: './path/to/library/ios',
          folder: './path/to/library',
          pbxprojPath:
            './path/to/library/ios/CodePush.xcodeproj/project.pbxproj',
          podfile: './path/to/podfile',
          podspec: 'CodePush',
          projectPath: './path/to/library/ios/CodePush.xcodeproj',
          projectName: 'CodePush.xcodeproj',
          libraryFolder: 'Libraries',
          sharedLibraries: ['libz'],
        },
        android: {
          sourceDir: './path/to/library/android/app',
          folder: './path/to/library',
          manifest: {},
          packageImportPath: 'import com.hello.MyPackage;',
          packageInstance: 'new MyPackage()',
        },
      },
      assets: dependencyConfig.dependency.assets,
      hooks: dependencyConfig.dependency.hooks,
      params: dependencyConfig.dependency.params,
    },
  },
  commands: dependencyConfig.commands,
  haste: {
    providesModuleNodeModules: ['react-native-windows'],
    platforms: ['windows'],
  },
  reactNativePath: './path/to/react-native',
};

export const config: UserConfigT = {
  ...projectConfig,
  ...dependencyConfig,
};

export const legacyConfig: LegacyDependencyUserConfigT = {
  plugin: multipleValidOptions('./path/to/a/plugin.js', [
    './path/to/foo/plugin.js',
    './path/to/bar/plugin.js',
  ]),
  platform: './path/to/a/platform.js',
  haste: {
    platforms: ['windows'],
    providesModuleNodeModules: ['react-native-windows'],
  },
  assets: dependencyConfig.dependency.assets,
  commands: dependencyConfig.dependency.hooks,
  android: dependencyConfig.dependency.platforms.android,
  ios: dependencyConfig.dependency.platforms.ios,
  params: dependencyConfig.dependency.params,
};
