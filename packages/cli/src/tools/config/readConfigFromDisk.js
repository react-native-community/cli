/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import Joi from 'joi';
import comsmiconfig from 'cosmiconfig';
import path from 'path';

import {
  type DependencyUserConfigT,
  type ProjectUserConfigT,
} from './types.flow';

import resolveReactNativePath from './resolveReactNativePath';
import getPackageConfiguration from '../getPackageConfiguration';

import * as schema from './schema';

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

  const result = Joi.validate(config, schema.projectUserConfig);

  if (result.error) {
    throw result.error;
  }

  return {
    ...result.value,
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

  const result = Joi.validate(config, schema.dependencyUserConfig);

  if (result.error) {
    throw result.error;
  }

  return result.value;
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

  const {error, value} = Joi.validate(config, schema.legacyDependencyConfig);

  if (error) {
    throw error;
  }

  return {
    dependency: {
      platforms: {
        ios: value.ios,
        android: value.android,
      },
      assets: value.assets,
      hooks: value.commands,
      params: value.params,
    },
    commands: [].concat(value.plugin || []),
    platforms: value.platform
      ? require(path.join(rootFolder, value.platform))
      : undefined,
  };
}
