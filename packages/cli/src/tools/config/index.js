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
} from './readConfigFromDisk';

function loadConfig() {
  const defaultConfig = findDependencies().reduce(
    (acc, dependencyName) => {
      const config = readDependencyConfigFromDisk(dependencyName);
      return {
        dependencies: {
          ...acc.dependencies,
          get [dependencyName]() {
            return Object.keys(acc.platforms).reduce((dependency, platform) => {
              const platformConfig = get(config, `dependency.${platform}`, {});
              if (platformConfig === null) {
                return dependency;
              }
              const detectedConfig = acc.platforms[platform].dependencyConfig(
                config.root,
                platformConfig,
              );
              if (detectedConfig === null) {
                return dependency;
              }
              dependency[platform] = {
                ...detectedConfig,
                ...platformConfig,
              };
              return dependency;
            }, {});
          },
        },
        commands: acc.commands.concat(
          (config.commands || []).map(pathToCommand =>
            path.join(dependencyName, pathToCommand),
          ),
        ),
        platforms: {
          ...acc.platforms,
          ...mapValues(config.platforms, pathToPlatform =>
            require(path.join(dependencyName, pathToPlatform)),
          ),
        },
        haste: {
          providesModuleNodeModules: acc.haste.providesModuleNodeModules.concat(
            get(config, 'haste.providesModuleNodeModules', []),
          ),
          platforms: acc.haste.platforms.concat(
            get(config, 'haste.platforms', []),
          ),
        },
      };
    },
    {
      root: process.cwd(),
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

  return merge(defaultConfig, readProjectConfigFromDisk());
}

export default loadConfig;
