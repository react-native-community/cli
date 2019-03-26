/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import comsmiconfig from 'cosmiconfig';
import path from 'path';
import {validate} from 'jest-validate';
import dedent from 'dedent';

import type {DependencyUserConfigT, ProjectUserConfigT} from './types.flow';

import resolveReactNativePath from './resolveReactNativePath';
import getPackageConfiguration from '../getPackageConfiguration';

import {
  config as exampleConfig,
  legacyConfig as exampleLegacyConfig,
} from './samples';

/**
 * Places to look for the new configuration
 */
const searchPlaces = ['react-native.config.js', 'package.json'];

/**
 * Reads a project configuration as defined by the user in the current
 * workspace.
 */
export function readProjectConfigFromDisk(): ProjectUserConfigT {
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

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules`.
 *
 * Returns `undefined` when no custom configuration is found
 * in the dependency root.
 */
export function readDependencyConfigFromDisk(
  rootFolder: string,
  dependencyName: string,
): ?DependencyUserConfigT {
  const explorer = comsmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const {config} = explorer.searchSync(rootFolder) || {config: undefined};

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

/**
 * Reads a legacy configuaration from a `package.json` "rnpm" key.
 *
 * Prints deprecation warnings for each of the keys along the upgrade instructions.
 *
 * Returns `undefined` when no configuration is provided.
 */
export function readLegacyDependencyConfigFromDisk(
  rootFolder: string,
  dependencyName: string,
): ?DependencyUserConfigT {
  const config = getPackageConfiguration(rootFolder);

  // For historical reasons, `getPackageConfiguration` always returns an
  // object, including empty when no cofinguration found.
  if (Object.keys(config).length === 0) {
    return undefined;
  }

  validate(config, {
    exampleConfig: exampleLegacyConfig,
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

        We now automatically configure Metro to support your platform.`,
      ios: ({ios}) => dedent`
        Setting \`rnpm.ios\` in \`package.json\` has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "dependency": {
              "ios": ${JSON.stringify(ios)}
            }
          }
        }`,
      android: ({android}) => dedent`
        Setting \`rnpm.android\` in \`package.json\` has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "dependency": {
              "android": ${JSON.stringify(android)}
            }
          }
        }`,
      assets: ({assets}) => dedent`
        Setting \`rnpm.assets\` in \`package.json\` has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "dependency": {
              "assets": ${JSON.stringify(assets)}
            }
          }
        }`,
      commands: ({commands}) => dedent`
        Setting \`rnpm.commands\` in \`package.json\` has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "dependency": {
              "hooks": ${JSON.stringify(commands)}
            }
          }
        }`,
      params: ({params}) => dedent`
        Setting \`rnpm.params\` in \`package.json\` has been deprecated and will stop
        working in next release.

        Consider setting the following in the \`package.json\` instead:
        {
          "react-native": {
            "dependency": {
              "params": ${JSON.stringify(params)}
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
    dependency: {
      platforms: {
        ios: config.ios,
        android: config.android,
      },
      assets: config.assets,
      hooks: config.commands,
      params: config.params,
    },
    commands: [].concat(config.plugin || []),
    platforms: config.platform
      ? require(path.join(rootFolder, config.platform))
      : undefined,
  };
}
