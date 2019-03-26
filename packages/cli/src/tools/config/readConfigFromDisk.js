/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import comsmiconfig from 'cosmiconfig';
import path from 'path';
import {validate, multipleValidOptions} from 'jest-validate';
import dedent from 'dedent';

import type {ProjectConfig, DependencyConfig} from './types.flow';

import resolveReactNativePath from './resolveReactNativePath';
import getPackageConfiguration from '../getPackageConfiguration';

const exampleProjectConfig: ProjectConfig = {
  reactNativePath: '.',
};

const exampleDependencyConfig = {
  dependency: {
    android: '',
    ios: '',
  },
  platforms: {
    windows: './platform.js',
  },
  commands: ['./local-cli/runWindows/runWindows.js'],
};

const exampleDeprecatedConfig = {
  plugin: multipleValidOptions('./path/to/a/plugin.js', [
    './path/to/foo/plugin.js',
    './path/to/bar/plugin.js',
  ]),
  platform: './path/to/a/platform.js',
  haste: {
    platforms: ['windows'],
    providesModuleNodeModules: ['react-native-windows'],
  },
};

const exampleConfig = {
  ...exampleProjectConfig,
  ...exampleDependencyConfig,
};

const searchPlaces = ['react-native.config.js', 'package.json'];

export function readProjectConfigFromDisk(): ProjectConfig {
  const explorer = comsmiconfig('react-native', {searchPlaces});

  const {config} = explorer.searchSync() || {config: {}};

  validate(config, {exampleConfig});

  return {
    ...config,
    reactNativePath: config.reactNativePath
      ? config.reactNativePath
      : resolveReactNativePath(),
  };
}

export function readDependencyConfigFromDisk(
  dependencyName: string,
): DependencyConfig {
  const root = path.resolve(process.cwd(), 'node_modules', dependencyName);

  const explorer = comsmiconfig('react-native', {
    stopDir: root,
    searchPlaces,
  });

  const {config} = explorer.searchSync(root) || {config: undefined};

  if (!config) {
    return undefined;
  }

  validate(config, {
    exampleConfig,
    title: {
      warning: `Warnings from ${dependencyName}`,
      error: `Errors from ${dependencyName}`,
      deprecation: `Deprecations from ${dependencyName}`,
    },
  });

  return config;
}

export function readLegacyDependencyConfigFromDisk(dependencyName: string) {
  const root = path.resolve(process.cwd(), 'node_modules', dependencyName);
  const config = getPackageConfiguration(root);

  if (Object.keys(config).length === 0) {
    return undefined;
  }

  validate(config, {
    exampleConfig: exampleDeprecatedConfig,
    deprecatedConfig: {
      plugin: ({plugin}) => dedent`
        Setting \`rnpm.plugin\` in \`package.json\` in order to extend
        React Native CLI has been deprecated and will stop working in the next
        React Native release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "commands": ${JSON.stringify([].concat(plugin))}
          }
        }`,
      platform: ({platform}) => dedent`
        Setting \`rnpm.platform\` in \`package.json\` in order to define
        additional platforms has been deprecated and will stop working in the next
        React Native release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "platforms": {
              "<name_of_the_platform>": "${platform}"
            }
          }
        }`,
      haste: ({haste}) => dedent`
        Setting \`rnpm.haste\` in \`package.json\` in order to define
        additional settings for Metro has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "haste": {
              "platforms": ${JSON.stringify(haste.platforms)},
              "providesModuleNodeModules": ${JSON.stringify(
                haste.providesModuleNodeModules,
              )}
            }
          }
        }`,
    },
    title: {
      warning: `Warnings from ${dependencyName}`,
      error: `Errors from ${dependencyName}`,
      deprecation: `Deprecations from ${dependencyName}`,
    },
  });

  return {
    commands: [].concat(config.plugin),
    platforms: config.platform
      ? require(path.join(root, config.platform))
      : undefined,
    haste: config.haste,
  };
}
