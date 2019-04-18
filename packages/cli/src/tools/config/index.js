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

import {type ConfigT} from 'types';

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
 *
 * @todo Support monorepos and do not use `path.join` but `require.resolve` instead
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  const userProjectConfig = readConfigFromDisk(projectRoot);
  const userDependencyConfig = readDependencyConfigFromDisk(projectRoot);
  const {name: projectName} = require(path.join(projectRoot, 'package.json'));

  const dependenies = findDependencies(projectRoot).reduce(
    (acc, dependencyName) => {
      const root = path.join(projectRoot, 'node_modules', dependencyName);
      try {
        return acc.concat({
          root,
          config:
            readLegacyDependencyConfigFromDisk(root) ||
            readDependencyConfigFromDisk(root),
          name: dependencyName,
        });
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
    },
    [{config: userDependencyConfig, root: projectRoot, name: projectName}],
  );

  const finalConfig = dependenies.reduce(
    (acc: ConfigT, {root, config, name}) => {
      /**
       * This workaround is necessary for development only before
       * first 0.60.0-rc.0 gets released and we can switch to it
       * while testing.
       */
      if (name === 'react-native') {
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
          // $FlowIssue: Computed getters are not supported
          get [name]() {
            return merge(
              {
                root,
                name,
                platforms: Object.keys(finalConfig.platforms).reduce(
                  (dependency, platform) => {
                    // Linking platforms is not supported
                    dependency[platform] = isPlatform
                      ? null
                      : finalConfig.platforms[platform].dependencyConfig(
                          root,
                          config.dependency[platform] || {},
                        );
                    return dependency;
                  },
                  {},
                ),
                assets: findAssets(root, config.assets),
                hooks: mapValues(config.hooks, makeHook),
                params: config.params,
              },
              userProjectConfig.dependencies[name] || {},
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
            isPlatform ? name : [],
          ),
          platforms: [...acc.haste.platforms, ...Object.keys(config.platforms)],
        },
      });
    },
    ({
      root: projectRoot,
      dependencies: {},
      commands: [],
      platforms: {},
      haste: {
        providesModuleNodeModules: [],
        platforms: [],
      },
      get reactNativePath() {
        return userProjectConfig.reactNativePath
          ? path.resolve(projectRoot, userProjectConfig.reactNativePath)
          : resolveReactNativePath(projectRoot);
      },
      get project() {
        const project = {};
        for (const platform in finalConfig.platforms) {
          project[platform] = finalConfig.platforms[platform].projectConfig(
            projectRoot,
            userProjectConfig.project[platform] || {},
          );
        }
        return project;
      },
      get assets() {
        return findAssets(projectRoot, userProjectConfig.assets);
      },
    }: ConfigT),
  );

  return finalConfig;
}

export default loadConfig;
