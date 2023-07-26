import cosmiconfig from 'cosmiconfig';
import {JoiError} from './errors';
import * as schema from './schema';
import {
  UserConfig,
  UserDependencyConfig,
} from '@react-native-community/cli-types';
import {logger, inlineString} from '@react-native-community/cli-tools';
import chalk from 'chalk';

/**
 * Places to look for the configuration file.
 */
const searchPlaces = ['react-native.config.js'];

/**
 * Reads a project configuration as defined by the user in the current
 * workspace.
 */
export function readConfigFromDisk(rootFolder: string): UserConfig {
  const explorer = cosmiconfig('react-native', {
    searchPlaces,
    stopDir: rootFolder,
  });

  const searchResult = explorer.searchSync(rootFolder);
  const config = searchResult ? searchResult.config : undefined;
  const result = schema.projectConfig.validate(config);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value as UserConfig;
}

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules`.
 */
export function readDependencyConfigFromDisk(
  rootFolder: string,
  dependencyName: string,
): UserDependencyConfig {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const searchResult = explorer.searchSync(rootFolder);
  const config = searchResult ? searchResult.config : emptyDependencyConfig;

  const result = schema.dependencyConfig.validate(config, {abortEarly: false});

  if (result.error) {
    const validationError = new JoiError(result.error);
    logger.warn(
      inlineString(`
        Package ${chalk.bold(
          dependencyName,
        )} contains invalid configuration: ${chalk.bold(
        validationError.message,
      )}.
      
      Please verify it's properly linked using "npx react-native config" command and contact the package maintainers about this.`),
    );
  }

  return result.value as UserDependencyConfig;
}

const emptyDependencyConfig = {
  dependency: {
    platforms: {},
  },
  commands: [],
  platforms: {},
};
