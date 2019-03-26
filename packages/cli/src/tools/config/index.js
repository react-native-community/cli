/**
 *
 */
import {get, mapValues} from 'lodash';
import path from 'path';
import merge from 'deepmerge';

import * as ios from '../ios';
import * as android from '../android';

import findDependencies from './findDependencies';

import {
  readProjectConfigFromDisk,
  readDependencyConfigFromDisk,
  readLegacyDependencyConfigFromDisk,
} from './readConfigFromDisk';

function loadConfig() {
  const defaultConfig = findDependencies().reduce(
    (acc, dependencyName) => {
      const root = path.join(process.cwd(), 'node_modules', dependencyName);

      const config =
        readDependencyConfigFromDisk(root, dependencyName) ||
        readLegacyDependencyConfigFromDisk(root, dependencyName) ||
        {};

      const platforms = mapValues(
        get(config, 'platforms', {}),
        pathOrObject =>
          typeof pathOrObject === 'string'
            ? require(path.join(dependencyName, pathOrObject))
            : pathOrObject,
      );

      return {
        dependencies: {
          ...acc.dependencies,
          get [dependencyName]() {
            return Object.keys(acc.platforms).reduce((dependency, platform) => {
              const platformConfig = get(config, `dependency.${platform}`, {});
              const detectedConfig = acc.platforms[platform].dependencyConfig(
                root,
                platformConfig,
              );
              if (detectedConfig === null) {
                dependency[platform] = null;
              } else {
                dependency[platform] = {
                  ...detectedConfig,
                  ...platformConfig,
                };
              }
              return dependency;
            }, {});
          },
        },
        commands: acc.commands.concat(
          get(config, 'commands', []).map(pathToCommand =>
            path.join(dependencyName, pathToCommand),
          ),
        ),
        platforms: {
          ...acc.platforms,
          ...platforms,
        },
        haste: {
          providesModuleNodeModules: acc.haste.providesModuleNodeModules.concat(
            Object.keys(platforms).length > 0 ? dependencyName : [],
          ),
          platforms: [...acc.haste.platforms, ...Object.keys(platforms)],
        },
      };
    },
    {
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
    },
  );

  return merge(
    {...defaultConfig, root: process.cwd()},
    readProjectConfigFromDisk(),
  );
}

export default loadConfig;
