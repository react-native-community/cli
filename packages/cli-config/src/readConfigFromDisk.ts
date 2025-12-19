import type {CosmiconfigResult} from 'cosmiconfig';
import {cosmiconfig, cosmiconfigSync} from 'cosmiconfig';
import {JoiError} from './errors';
import * as schema from './schema';
import type {
  UserConfig,
  UserDependencyConfig,
} from '@react-native-community/cli-types';
import {logger, inlineString} from '@react-native-community/cli-tools';
import pico from 'picocolors';

/**
 * Places to look for the configuration file.
 * Note that we need different sets for CJS and ESM because the synchronous
 * version cannot contain `.mjs` files. Doing so will cause "Error: Missing
 * loader for extension" during runtime.
 */
const searchPlacesForCJS = [
  'react-native.config.js',
  'react-native.config.cjs',
  'react-native.config.ts',
];
const searchPlaces = [...searchPlacesForCJS, 'react-native.config.mjs'];

function parseUserConfig(searchResult: CosmiconfigResult): UserConfig {
  const config = searchResult ? searchResult.config : undefined;
  const result = schema.projectConfig.validate(config);

  if (result.error) {
    throw new JoiError(result.error);
  }

  return result.value as UserConfig;
}

/**
 * Reads a project configuration as defined by the user in the current
 * workspace.
 */
export async function readConfigFromDiskAsync(
  rootFolder: string,
): Promise<UserConfig> {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const searchResult = await explorer.search(rootFolder);
  return parseUserConfig(searchResult);
}

/**
 * Reads a project configuration as defined by the user in the current
 * workspace synchronously.
 */

export function readConfigFromDisk(rootFolder: string): UserConfig {
  const explorer = cosmiconfigSync('react-native', {
    stopDir: rootFolder,
    searchPlaces: searchPlacesForCJS,
  });

  const searchResult = explorer.search(rootFolder);
  return parseUserConfig(searchResult);
}

function parseDependencyConfig(
  dependencyName: string,
  searchResult: CosmiconfigResult,
): UserDependencyConfig {
  const config = searchResult ? searchResult.config : emptyDependencyConfig;

  const result = schema.dependencyConfig.validate(config, {abortEarly: false});

  if (result.error) {
    const validationError = new JoiError(result.error);
    logger.warn(
      inlineString(`
        Package ${pico.bold(
          dependencyName,
        )} contains invalid configuration: ${pico.bold(
        validationError.message,
      )}.

      Please verify it's properly linked using "npx react-native config" command and contact the package maintainers about this.`),
    );
  }

  return result.value as UserDependencyConfig;
}

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules`.
 */
export async function readDependencyConfigFromDiskAsync(
  rootFolder: string,
  dependencyName: string,
): Promise<UserDependencyConfig> {
  const explorer = cosmiconfig('react-native', {
    stopDir: rootFolder,
    searchPlaces,
  });

  const searchResult = await explorer.search(rootFolder);
  return parseDependencyConfig(dependencyName, searchResult);
}

/**
 * Reads a dependency configuration as defined by the developer
 * inside `node_modules` synchronously.
 */

export function readDependencyConfigFromDisk(
  rootFolder: string,
  dependencyName: string,
): UserDependencyConfig {
  const explorer = cosmiconfigSync('react-native', {
    stopDir: rootFolder,
    searchPlaces: searchPlacesForCJS,
  });

  const searchResult = explorer.search(rootFolder);
  return parseDependencyConfig(dependencyName, searchResult);
}

const emptyDependencyConfig = {
  dependency: {
    platforms: {},
  },
  commands: [],
  platforms: {},
};
