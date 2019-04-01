/**
 * @flow
 */
import dedent from 'dedent';
import path from 'path';
import merge from 'deepmerge';

import findDependencies from './findDependencies';
import {
  readProjectConfigFromDisk,
  readDependencyConfigFromDisk,
  readLegacyDependencyConfigFromDisk,
} from './readConfigFromDisk';

import {type ProjectConfigT, type TemporaryProjectConfigT} from './types.flow';

/**
 * Built-in platforms
 */
import * as ios from '../ios';
import * as android from '../android';
import resolveReactNativePath from './resolveReactNativePath';

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = process.cwd()): ProjectConfigT {
  const inferredProjectConfig = findDependencies(projectRoot).reduce(
    (acc: TemporaryProjectConfigT, dependencyName) => {
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
    }: TemporaryProjectConfigT),
  );

  const config: TemporaryProjectConfigT = merge(
    inferredProjectConfig,
    readProjectConfigFromDisk(projectRoot),
  );

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

  // $FlowIssue: `reactNativePath: null` is never null at this point
  return config;
}

export default loadConfig;
