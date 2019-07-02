/**
 * @flow
 *
 * Loads and validates a project configuration
 */
import Joi from '@hapi/joi';
import cosmiconfig from 'cosmiconfig';
import path from 'path';
import chalk from 'chalk';
import {
  type UserDependencyConfigT,
  type UserConfigT,
  type CommandT,
} from 'types';
import {JoiError} from './errors';
import * as schema from './schema';
import {logger} from '@react-native-community/cli-tools';
import resolveReactNativePath from './resolveReactNativePath';

const MIGRATION_GUIDE = `Migration guide: ${chalk.dim.underline(
  'https://github.com/react-native-community/cli/blob/master/docs/configuration.md',
)}`;

/**
 * Places to look for the new configuration
 */
const searchPlaces = ['react-native.config.js'];

function readLegacyConfigFromDisk(rootFolder: string): UserConfigT | void {
  let config;

  try {
    config = require(path.join(rootFolder, 'package.json')).rnpm;
  } catch (error) {
    // when `init` is running, there's no package.json yet
    return undefined;
  }

  if (!config) {
    return undefined;
  }

  const transformedConfig = {
    project: {
      ios: config.ios,
      android: config.android,
    },
    assets: config.assets,
    commands: [],
    dependencies: {},
    platforms: {},
    get reactNativePath() {
      return config.reactNativePath
        ? path.resolve(rootFolder, config.reactNativePath)
        : resolveReactNativePath(rootFolder);
    },
  };

  logger.warn(
    `Your project is using deprecated "${chalk.bold(
      'rnpm',
    )}" config that will stop working from next release. Please use a "${chalk.bold(
      'react-native.config.js',
    )}" file to configure the React Native CLI. ${MIGRATION_GUIDE}`,
  );

  return transformedConfig;
}

/**
 * Reads a project configuration as defined by the user in the current
 * workspace.
 */
export function readConfigFromDisk(rootFolder: string): UserConfigT {
  const explorer = cosmiconfig('react-native', {searchPlaces});

  const {config} = explorer.searchSync(rootFolder) || {
    config: readLegacyConfigFromDisk(rootFolder),
  };

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
): {config: UserDependencyConfigT, legacy?: boolean} {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const {config, legacy} = explorer.searchSync(rootFolder) || {
    config: readLegacyDependencyConfigFromDisk(rootFolder),
    legacy: true,
  };

  const result = Joi.validate(config, schema.dependencyConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return {config: result.value, legacy: legacy && config !== undefined};
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
 * Reads a legacy configuration from a `package.json` "rnpm" key.
 */
function readLegacyDependencyConfigFromDisk(
  rootFolder: string,
): ?UserDependencyConfigT {
  let config = {};

  try {
    config = require(path.join(rootFolder, 'package.json')).rnpm;
  } catch (error) {
    // package.json is usually missing in local libraries that are not in
    // project "dependencies", so we just return a bare config
    return {
      dependency: {
        platforms: {},
        assets: [],
        hooks: {},
        params: [],
      },
      commands: [],
      platforms: {},
    };
  }

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
    haste: config.haste,
    commands: loadProjectCommands(rootFolder, config.plugin),
    platforms: config.platform
      ? require(path.join(rootFolder, config.platform))
      : {},
  };

  return transformedConfig;
}
