/**
 * @flow
 */
import path from 'path';
import deepmerge from 'deepmerge';
import {mapValues} from 'lodash';

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

/**
 * Built-in platforms
 */
import * as ios from '../ios';
import * as android from '../android';

/**
 * `deepmerge` concatenates arrays by default instead of overwriting them.
 * We define custom merging function for arrays to change that behaviour
 */
const merge = (...objs: Object[]) =>
  deepmerge(...objs, {
    arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
  });

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  const userConfig = readConfigFromDisk(projectRoot);

  const finalConfig = findDependencies(projectRoot).reduce(
    (acc: ConfigT, dependencyName) => {
      const root = path.join(projectRoot, 'node_modules', dependencyName);

      const config =
        readLegacyDependencyConfigFromDisk(root) ||
        readDependencyConfigFromDisk(root);

      // @todo: Make React Native integrate with CLI just like other platforms
      const isPlatform =
        Object.keys(config.platforms).length > 0 ||
        dependencyName === 'react-native';

      return {
        ...acc,
        dependencies: assign(acc.dependencies, {
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
        commands: acc.commands.concat(
          config.commands.map(pathToCommand =>
            path.join(dependencyName, pathToCommand),
          ),
        ),
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
      };
    },
    ({
      root: projectRoot,
      get reactNativePath() {
        return (
          userConfig.reactNativePath || resolveReactNativePath(projectRoot)
        );
      },
      dependencies: {},
      commands: userConfig.commands,
      get assets() {
        return findAssets(projectRoot, userConfig.assets);
      },
      platforms: {
        ios,
        android,
      },
      haste: {
        providesModuleNodeModules: [],
        platforms: [],
      },
      get project() {
        return Object.keys(this.platforms).reduce(
          (project, platform) => {
            project[platform] = this.platforms[platform].projectConfig(
              projectRoot,
              userConfig.project[platform] || {},
            );
            return project;
          },
          {ios: null, android: null},
        );
      },
    }: ConfigT),
  );

  return finalConfig;
}

export default loadConfig;
