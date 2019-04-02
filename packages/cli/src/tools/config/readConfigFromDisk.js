/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import Joi from 'joi';
import cosmiconfig from 'cosmiconfig';
import path from 'path';

import {type DependencyConfigT, type UserConfigT} from './types.flow';

import {JoiError} from '../errors';

import * as schema from './schema';
import logger from '../logger';

/**
 * Places to look for the new configuration
 */
const searchPlaces = ['react-native.config.js', 'package.json'];

/**
 * Reads a project configuration as defined by the user in the current
 * workspace.
 */
export function readConfigFromDisk(rootFolder: string): UserConfigT {
  const explorer = cosmiconfig('react-native', {searchPlaces});

  const {config} = explorer.searchSync(rootFolder) || {config: undefined};

  const result = Joi.validate(config, schema.projectConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value;
}

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules`.
 */
export function readDependencyConfigFromDisk(
  rootFolder: string,
): DependencyConfigT {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const {config} = explorer.searchSync(rootFolder) || {config: undefined};

  const result = Joi.validate(config, schema.dependencyConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value;
}

/**
 * Reads a legacy configuaration from a `package.json` "rnpm" key.
 */
export function readLegacyDependencyConfigFromDisk(
  rootFolder: string,
): ?DependencyConfigT {
  const {rnpm: config, name} = require(path.join(rootFolder, 'package.json'));

  if (!config) {
    return undefined;
  }

  const transformedConfig = {
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

  // @todo: paste a link to documentation that explains the migration steps
  logger.warn(
    `Package '${path.basename(
      name,
    )}' is using deprecated "rnpm" config that will stop working from next release. Consider upgrading to the new config format.`,
  );

  const result = Joi.validate(transformedConfig, schema.dependencyConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value;
}
