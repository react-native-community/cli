/**
 * @flow
 */
import path from 'path';
import merge from 'deepmerge';
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
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  const userConfig = readConfigFromDisk(projectRoot);

  const inferredConfig = findDependencies(projectRoot).reduce(
    (acc: ConfigT, dependencyName) => {
      const root = path.join(projectRoot, 'node_modules', dependencyName);

      const config =
        readLegacyDependencyConfigFromDisk(root) ||
        readDependencyConfigFromDisk(root);

      return assign({}, acc, {
        dependencies: {
          ...acc.dependencies,
          // $FlowIssue: Computed getters are not yet supported.
          get [dependencyName]() {
            return {
              name: dependencyName,
              platforms: Object.keys(acc.platforms).reduce(
                (dependency, platform) => {
                  dependency[platform] = acc.platforms[
                    platform
                  ].dependencyConfig(
                    root,
                    config.dependency.platforms[platform],
                  );
                  return dependency;
                },
                {},
              ),
              assets: findAssets(root, config.dependency.assets),
              hooks: mapValues(config.dependency.hooks, makeHook),
              params: config.dependency.params,
            };
          },
        },
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
            Object.keys(config.platforms).length > 0 ? dependencyName : [],
          ),
          platforms: [...acc.haste.platforms, ...Object.keys(config.platforms)],
        },
      });
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
      assets: findAssets(projectRoot, userConfig.assets),
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
              userConfig.project[platform],
            );
            return project;
          },
          {ios: null, android: null},
        );
      },
    }: ConfigT),
  );

  return assign({}, inferredConfig, {
    // @todo rewrite `merge` to use `assign` to not run getters unless needed
    dependencies: merge(inferredConfig.dependencies, userConfig.dependencies),
  });
}

export default loadConfig;
