import type {CosmiconfigResult} from 'cosmiconfig';
import {cosmiconfig, cosmiconfigSync} from 'cosmiconfig';
import {JoiError} from './errors';
import * as schema from './schema';
import type {
  UserConfig,
  UserDependencyConfig,
} from '@react-native-community/cli-types';
import {logger, inlineString} from '@react-native-community/cli-tools';
import chalk from 'chalk';

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

/**
 * Suppress console output temporarily to prevent config file logs from appearing
 */
function suppressConsole() {
  const originalMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  // Override console methods with empty functions
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};

  return () => {
    // Restore original console methods
    console.log = originalMethods.log;
    console.warn = originalMethods.warn;
    console.error = originalMethods.error;
    console.info = originalMethods.info;
    console.debug = originalMethods.debug;
  };
}

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

  // Suppress console output during config loading
  const restoreConsole = suppressConsole();
  try {
    const searchResult = await explorer.search(rootFolder);
    return parseUserConfig(searchResult);
  } finally {
    restoreConsole();
  }
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

  // Suppress console output during config loading
  const restoreConsole = suppressConsole();
  try {
    const searchResult = explorer.search(rootFolder);
    return parseUserConfig(searchResult);
  } finally {
    restoreConsole();
  }
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

  // Suppress console output during config loading
  const restoreConsole = suppressConsole();
  try {
    const searchResult = await explorer.search(rootFolder);
    return parseDependencyConfig(dependencyName, searchResult);
  } finally {
    restoreConsole();
  }
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

  // Suppress console output during config loading
  const restoreConsole = suppressConsole();
  try {
    const searchResult = explorer.search(rootFolder);
    return parseDependencyConfig(dependencyName, searchResult);
  } finally {
    restoreConsole();
  }
}

const emptyDependencyConfig = {
  dependency: {
    platforms: {},
  },
  commands: [],
  platforms: {},
};
