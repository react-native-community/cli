import Joi from '@hapi/joi';
import cosmiconfig from 'cosmiconfig';
import path from 'path';
import chalk from 'chalk';
import {JoiError} from './errors';
import * as schema from './schema';
import {logger} from '@react-native-community/cli-tools';
import resolveReactNativePath from './resolveReactNativePath';
import {
  UserConfig,
  AndroidProjectConfig,
  IOSProjectConfig,
  Command,
  InquirerPrompt,
} from '../../../../cli-types';

import {UserDependencyConfig} from '@react-native-community/cli-types/src';
const MIGRATION_GUIDE = `Migration guide: ${chalk.dim.underline(
  'https://github.com/react-native-community/cli/blob/master/docs/configuration.md',
)}`;

type LegacyConfig = {
  ios: IOSProjectConfig;
  android: AndroidProjectConfig;
  assets: string[];
  reactNativePath: string;
};

type LegacyDependencyConfig = {
  platform: any;
  ios: IOSProjectConfig;
  android: AndroidProjectConfig;
  assets: string[];
  plugin: Array<string>;
  params: InquirerPrompt[];
  haste: any;
  commands: Command[];
};

/**
 * Places to look for the new configuration
 */
const searchPlaces = ['react-native.config.js'];

function readLegacyConfigFromDisk(rootFolder: string): UserConfig | void {
  let config: LegacyConfig;

  try {
    config = require(path.join(rootFolder, 'package.json')).rnpm;
  } catch (error) {
    // when `init` is running, there's no package.json yet
    return undefined;
  }

  if (!config) {
    return undefined;
  }

  const reactNativePath = config.reactNativePath
    ? path.resolve(rootFolder, config.reactNativePath)
    : resolveReactNativePath(rootFolder);

  const transformedConfig: UserConfig = {
    reactNativePath: reactNativePath,
    project: {
      android: config.android,
      ios: config.ios,
    },
    assets: config.assets,
    commands: [],
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
export function readConfigFromDisk(rootFolder: string): UserConfig {
  const explorer = cosmiconfig('react-native', {searchPlaces});

  const {config} = explorer.searchSync(rootFolder) || {
    config: readLegacyConfigFromDisk(rootFolder),
  };

  const result = Joi.validate(config, schema.projectConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return config as UserConfig;
}

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules`.
 */
export function readDependencyConfigFromDisk(
  rootFolder: string,
): {config: UserDependencyConfig; legacy?: boolean} {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });
  const config: cosmiconfig.CosmiconfigResult = explorer.searchSync(rootFolder);
  const legacy = config ? true : false;
  // @ts-ignore Joi validate the type
  const dependencyConfig: UserDependencyConfig = config
    ? (config.config as UserDependencyConfig)
    : readLegacyDependencyConfigFromDisk(rootFolder);

  const result = Joi.validate(config, schema.dependencyConfig);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return {config: dependencyConfig, legacy: legacy && config !== undefined};
}

// /**
//  * Returns an array of commands that are defined in the project.
//  *
//  * `config.project` can be either an array of paths or a single string.
//  * Each of the files can export a commands (object) or an array of commands
//  */
const loadProjectCommands = (
  root: string,
  ...commands: string[]
): Command[] => {
  return commands.reduce((acc: Command[], cmdPath: string) => {
    const cmds: Array<Command> | Command = require(path.join(root, cmdPath));
    return acc.concat(cmds);
  }, []);
};

// /**
//  * Reads a legacy configuration from a `package.json` "rnpm" key.
//  */
function readLegacyDependencyConfigFromDisk(
  rootFolder: string,
): UserDependencyConfig | undefined {
  let config: LegacyDependencyConfig;

  try {
    config = require(path.join(rootFolder, 'package.json')).rnpm;
  } catch (error) {
    // package.json is usually missing in local libraries that are not in
    // project "dependencies", so we just return a bare config
    return {
      assets: [],
      dependencies: {
        dep: {
          name: '',
          root: '',
          platforms: {},
          assets: null,
          hooks: null,
          params: null,
        },
      },
      platforms: null,
      commands: [],
      haste: null,
    };
  }

  if (!config) {
    return undefined;
  }

  const platforms = config.platform
    ? require(path.join(rootFolder, config.platform))
    : {};
  const transformedConfig: UserDependencyConfig = {
    assets: [],
    dependencies: {
      dep: {
        name: '',
        root: '',
        platforms: {
          android: config.android,
          ios: config.ios,
        },
        assets: config.assets,
        hooks: config.commands,
        params: config.params,
      },
    },
    platforms: platforms,
    commands: loadProjectCommands(rootFolder, ...config.plugin),
    haste: config.haste,
  };

  return transformedConfig;
}
