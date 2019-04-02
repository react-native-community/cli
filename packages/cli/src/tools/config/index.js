/**
 * @flow
 */
import dedent from 'dedent';
import path from 'path';
import merge from 'deepmerge';
import {omit} from 'lodash';

import findDependencies from './findDependencies';
import {
  readConfigFromDisk,
  readDependencyConfigFromDisk,
  readLegacyDependencyConfigFromDisk,
} from './readConfigFromDisk';

import {type ConfigT, type RawConfigT} from './types.flow';

/**
 * Built-in platforms
 */
import * as ios from '../ios';
import * as android from '../android';
import resolveReactNativePath from './resolveReactNativePath';

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ConfigT {
  const userConfig = readConfigFromDisk(projectRoot);

  const inferredConfig = findDependencies(projectRoot).reduce(
    (acc: RawConfigT, dependencyName) => {
      const root = path.join(projectRoot, 'node_modules', dependencyName);

      const config =
        readLegacyDependencyConfigFromDisk(root) ||
        readDependencyConfigFromDisk(root);

      return {
        ...acc,
        dependencies: {
          ...acc.dependencies,
          // $FlowIssue: Computed getters are not yet supported.
          get [dependencyName]() {
            return {
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
              assets: config.dependency.assets,
              hooks: config.dependency.hooks,
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
      };
    },
    ({
      root: projectRoot,
      reactNativePath: resolveReactNativePath(projectRoot),
      dependencies: {},
      commands: [],
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
              userConfig.project,
            );
            return project;
          },
          {ios: null, android: null},
        );
      },
    }: RawConfigT),
  );

  /**
   * All config properties are deep-merged with user provided settings except for
   * the project, which is calculated
   */
  const config: ConfigT = merge(inferredConfig, omit(userConfig, 'project'));

  if (config.reactNativePath === null) {
    throw new Error(dedent`
      Unable to find React Native files. Make sure "react-native" module is installed
      in your project dependencies.

      If you are using React Native from a non-standard location, consider setting:
      {
        "react-native": {
          "reactNativePath": "./path/to/react-native"
        }
      }
      in your \`package.json\`.
    `);
  }

  return config;
}

export default loadConfig;
