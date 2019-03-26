/**
 * @flow
 *
 * Sample configuration objects that are used for `jest-validate`.
 *
 * See `./types.flow` for explanation of what
 * the properties are responsible for.
 */
import {multipleValidOptions} from 'jest-validate';

import type {UserConfigT, LegacyDependencyUserConfigT} from './types.flow';

const projectConfig = {
  reactNativePath: '.',
};

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
