/**
 * @flow
 */
import path from 'path';
import {mapValues} from 'lodash';
import chalk from 'chalk';

import findDependencies from './findDependencies';
import resolveReactNativePath from './resolveReactNativePath';
import findAssets from './findAssets';
import makeHook from './makeHook';
import {
  readConfigFromDisk,
  readDependencyConfigFromDisk,
  readLegacyDependencyConfigFromDisk,
} from './readConfigFromDisk';

import {type ConfigT} from './types.flow';

import assign from '../assign';
import merge from '../merge';
/**
 * Built-in platforms
 */
import * as ios from '@react-native-community/cli-platform-ios';
import * as android from '@react-native-community/cli-platform-android';
import {logger, inlineString} from '@react-native-community/cli-tools';

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  const userConfig = readConfigFromDisk(projectRoot);

  const finalConfig = findDependencies(projectRoot).reduce(
    (acc: ConfigT, dependencyName) => {
      const root = path.join(projectRoot, 'node_modules', dependencyName);

      let config;
      try {
        config =
          readLegacyDependencyConfigFromDisk(root) ||
          readDependencyConfigFromDisk(root);
      } catch (error) {
        logger.warn(
          inlineString(`
            Package ${chalk.bold(
              dependencyName,
            )} has been ignored because it contains invalid configuration.

            Reason: ${chalk.dim(error.message)}
          `),
        );
        return acc;
      }

      /**
       * This workaround is neccessary for development only before
       * first 0.60.0-rc.0 gets released and we can switch to it
       * while testing.
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

      return assign({}, acc, {
        dependencies: assign({}, acc.dependencies, {
          // $FlowExpectedError: Dynamic getters are not supported
          get [dependencyName]() {
            return merge(
              {
                name: dependencyName,
                platforms: Object.keys(finalConfig.platforms).reduce(
                  (dependency, platform) => {
                    // Linking platforms is not supported
                    dependency[platform] = isPlatform
                      ? null
                      : finalConfig.platforms[platform].dependencyConfig(
                          root,
                          config.dependency.platforms[platform] || {},
                        );
                    return dependency;
                  },
                  {},
                ),
                assets: findAssets(root, config.dependency.assets),
                hooks: mapValues(config.dependency.hooks, makeHook),
                params: config.dependency.params,
              },
              userConfig.dependencies[dependencyName] || {},
            );
          },
        }),
        commands: [...acc.commands, ...config.commands],
        platforms: {
          ...acc.platforms,
          ...config.platforms,
        },
        haste: {
          providesModuleNodeModules: acc.haste.providesModuleNodeModules.concat(
            isPlatform ? dependencyName : [],
          ),
          platforms: [...acc.haste.platforms, ...Object.keys(config.platforms)],
        },
      });
    },
    ({
      root: projectRoot,
      get reactNativePath() {
        return userConfig.reactNativePath
          ? path.resolve(projectRoot, userConfig.reactNativePath)
          : resolveReactNativePath(projectRoot);
      },
      dependencies: {},
      commands: userConfig.commands,
      get assets() {
        return findAssets(projectRoot, userConfig.assets);
      },
      platforms: {},
      haste: {
        providesModuleNodeModules: [],
        platforms: [],
      },
      get project() {
        const project = {};
        for (const platform in finalConfig.platforms) {
          project[platform] = finalConfig.platforms[platform].projectConfig(
            projectRoot,
            userConfig.project[platform] || {},
          );
        }
        return project;
      },
    }: ConfigT),
  );

  return finalConfig;
}

export default loadConfig;
