/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import Joi from 'joi';
import cosmiconfig from 'cosmiconfig';
import path from 'path';
import chalk from 'chalk';

import {
  type UserDependencyConfigT,
  type UserConfigT,
  type CommandT,
} from './types.flow';

import {JoiError} from './errors';

import * as schema from './schema';

import {logger} from '@react-native-community/cli-tools';

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
): UserDependencyConfigT {
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
 * Returns an array of commands that are defined in the project.
 *
 * `config.project` can be either an array of paths or a single string.
 * Each of the files can export a commands (object) or an array of commands
 */
const loadProjectCommands = (
  root,
  commands: ?(Array<string> | string),
): Array<CommandT> => {
  return []
    .concat(commands || [])
    .reduce((acc: Array<CommandT>, cmdPath: string) => {
      const cmds: Array<CommandT> | CommandT = require(path.join(
        root,
        cmdPath,
      ));
      return acc.concat(cmds);
    }, []);
};

/**
 * Reads a legacy configuaration from a `package.json` "rnpm" key.
 */
export function readLegacyDependencyConfigFromDisk(
  rootFolder: string,
): ?UserDependencyConfigT {
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
    commands: loadProjectCommands(rootFolder, config.plugin),
    platforms: config.platform
      ? require(path.join(rootFolder, config.platform))
      : undefined,
  };

  // @todo: paste a link to documentation that explains the migration steps
  logger.warn(
    `Package ${chalk.bold(
      path.basename(name),
    )} is using deprecated "rnpm" config that will stop working from next release. Consider upgrading to the new config format.`,
  );

  const result = Joi.validate(transformedConfig, schema.dependencyConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value;
}
