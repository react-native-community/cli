/**
 * @flow
 */
import path from 'path';
import chalk from 'chalk';
import {logger, inlineString} from '@react-native-community/cli-tools';
import * as ios from '@react-native-community/cli-platform-ios';
import * as android from '@react-native-community/cli-platform-android';
import findDependencies from './findDependencies';
import resolveReactNativePath from './resolveReactNativePath';
import findAssets from './findAssets';
import {
  readConfigFromDisk,
  readDependencyConfigFromDisk,
} from './readConfigFromDisk';
import type {
  ConfigT,
  UserDependencyConfigT,
  UserConfigT,
  DependencyConfigT,
} from 'types';
import assign from '../assign';
// $FlowFixMe - converted to TS
import merge from '../merge';
import resolveNodeModuleDir from './resolveNodeModuleDir';

function getDependencyConfig(
  root: string,
  dependencyName: string,
  finalConfig: ConfigT,
  config: UserDependencyConfigT,
  userConfig: UserConfigT,
  isPlatform: boolean,
): DependencyConfigT {
  return merge(
    {
      root,
      name: dependencyName,
      platforms: Object.keys(finalConfig.platforms).reduce(
        (dependency, platform) => {
          const platformConfig = finalConfig.platforms[platform];
          dependency[platform] =
            // Linking platforms is not supported
            isPlatform || !platformConfig
              ? null
              : platformConfig.dependencyConfig(
                  root,
                  /* $FlowFixMe - can't figure out which platform's dependency
                   config to choose */
                  config.dependency.platforms[platform],
                );
          return dependency;
        },
        {},
      ),
      assets: findAssets(root, config.dependency.assets),
      hooks: config.dependency.hooks,
      params: config.dependency.params,
    },
    userConfig.dependencies[dependencyName] || {},
  );
}

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  let lazyProject;
  const userConfig = readConfigFromDisk(projectRoot);

  const initialConfig: ConfigT = {
    root: projectRoot,
    get reactNativePath() {
      return userConfig.reactNativePath
        ? path.resolve(projectRoot, userConfig.reactNativePath)
        : resolveReactNativePath(projectRoot);
    },
    dependencies: userConfig.dependencies,
    commands: userConfig.commands,
    get assets() {
      return findAssets(projectRoot, userConfig.assets);
    },
    platforms: userConfig.platforms,
    haste: {
      providesModuleNodeModules: [],
      platforms: Object.keys(userConfig.platforms),
    },
    get project() {
      if (lazyProject) {
        return lazyProject;
      }

      lazyProject = {};
      for (const platform in finalConfig.platforms) {
        lazyProject[platform] = finalConfig.platforms[platform].projectConfig(
          projectRoot,
          userConfig.project[platform] || {},
        );
      }

      return lazyProject;
    },
  };

  let depsWithWarnings = [];

  const finalConfig = Array.from(
    new Set([
      ...Object.keys(userConfig.dependencies),
      ...findDependencies(projectRoot),
    ]),
  ).reduce((acc: ConfigT, dependencyName) => {
    const localDependencyRoot =
      userConfig.dependencies[dependencyName] &&
      userConfig.dependencies[dependencyName].root;
    let root;
    let config;
    try {
      root =
        localDependencyRoot ||
        resolveNodeModuleDir(projectRoot, dependencyName);
      const output = readDependencyConfigFromDisk(root);
      config = output.config;

      if (output.legacy && !localDependencyRoot) {
        const pkg = require(path.join(root, 'package.json'));
        const link =
          pkg.homepage || `https://npmjs.com/package/${dependencyName}`;
        depsWithWarnings.push([dependencyName, link]);
      }
    } catch (error) {
      logger.warn(
        inlineString(`
          Package ${chalk.bold(
            dependencyName,
          )} has been ignored because it contains invalid configuration.

          Reason: ${chalk.dim(error.message)}`),
      );
      return acc;
    }

    /**
     * @todo: remove this code once `react-native` is published with
     * `platforms` and `commands` inside `react-native.config.js`.
     */
    if (dependencyName === 'react-native') {
      if (Object.keys(config.platforms).length === 0) {
        config.platforms = {ios, android};
      }
      if (config.commands.length === 0) {
        config.commands = [...ios.commands, ...android.commands];
      }
    }

    const isPlatform = Object.keys(config.platforms).length > 0;

    /**
     * Legacy `rnpm` config required `haste` to be defined. With new config,
     * we do it automatically.
     *
     * @todo: Remove this once `rnpm` config is deprecated and all major RN libs are converted.
     */
    const haste = config.haste || {
      providesModuleNodeModules: isPlatform ? [dependencyName] : [],
      platforms: Object.keys(config.platforms),
    };

    return (assign({}, acc, {
      dependencies: assign({}, acc.dependencies, {
        // $FlowExpectedError: Dynamic getters are not supported
        get [dependencyName]() {
          return getDependencyConfig(
            root,
            dependencyName,
            finalConfig,
            config,
            userConfig,
            isPlatform,
          );
        },
      }),
      commands: [...acc.commands, ...config.commands],
      platforms: {
        ...acc.platforms,
        ...config.platforms,
      },
      haste: {
        providesModuleNodeModules: [
          ...acc.haste.providesModuleNodeModules,
          ...haste.providesModuleNodeModules,
        ],
        platforms: [...acc.haste.platforms, ...haste.platforms],
      },
    }): ConfigT);
  }, initialConfig);

  if (depsWithWarnings.length) {
    logger.warn(
      `The following packages use deprecated "rnpm" config that will stop working from next release:\n${depsWithWarnings
        .map(
          ([name, link]) =>
            `  - ${chalk.bold(name)}: ${chalk.dim(chalk.underline(link))}`,
        )
        .join(
          '\n',
        )}\nPlease notify their maintainers about it. You can find more details at ${chalk.dim.underline(
        'https://github.com/react-native-community/cli/blob/master/docs/configuration.md#migration-guide',
      )}.`,
    );
  }

  return finalConfig;
}

export default loadConfig;
