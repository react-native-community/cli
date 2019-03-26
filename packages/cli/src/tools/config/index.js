/**
 * @flow
 */
import {get, pickBy, mapValues} from 'lodash';
import path from 'path';
import merge from 'deepmerge';

import findDependencies from './findDependencies';
import {
  readProjectConfigFromDisk,
  readDependencyConfigFromDisk,
  readLegacyDependencyConfigFromDisk,
} from './readConfigFromDisk';

import {
  type DependencyConfigT,
  type ConfigT,
  type PlatformsT,
  type DependenciesConfigT,
} from './types.flow';

/**
 * Built-in platforms
 */
import * as ios from '../ios';
import * as android from '../android';

/**
 * Loads CLI configuration
 */
function loadConfig(): ConfigT {
  const defaultConfig = findDependencies().reduce(
    (acc: DependenciesConfigT, dependencyName) => {
      const root = path.join(process.cwd(), 'node_modules', dependencyName);

      /**
       * Read user-defined configuration for a dependency from new and old location.
       * We provide empty object at the end on purpose to access it easily with `get`
       */
      const config =
        readDependencyConfigFromDisk(root, dependencyName) ||
        readLegacyDependencyConfigFromDisk(root, dependencyName) ||
        {};

      /**
       * Because of legacy reasons (`rnpm` configuration), platforms can be an object.
       * This code handles this special case. In future releases, we will allow paths
       * to files only.
       */
      const availablePlatforms: PlatformsT = mapValues(
        get(config, 'platforms', {}),
        pathOrObject =>
          typeof pathOrObject === 'string'
            ? require(path.join(dependencyName, pathOrObject))
            : pathOrObject,
      );

      /**
       * Lazily gets dependency config for a current dependency.
       *
       * Note: this code is outside of the dynamic getter
       * on purpose to make Flow work.
       */
      const getDependencyConfig = (): DependencyConfigT => {
        /**
         * At the time of executing this function, `acc.platforms` will already
         * have all the platforms that are defined by other dependencies too.
         */
        const dependencyPlatforms = Object.keys(acc.platforms).reduce(
          (dependency, platform) => {
            /**
             * We generate a configuration for a given platform by passing
             * some non-standard developer-defined settings too
             */
            const platformConfig = get(
              config,
              `dependency.platforms.${platform}`,
              {},
            );
            // $FlowIssue: Invalid platforms are already filtered-out below
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
          },
          {
            ios: null,
            android: null,
          },
        );
        return {
          root,
          platforms: dependencyPlatforms,
          assets: get(config, 'assets', []),
          hooks: get(config, 'hooks', {}),
          params: get(config, 'params', []),
        };
      };

      return {
        dependencies: {
          ...acc.dependencies,
          // $FlowIssue: Computed getters are not yet supported.
          get [dependencyName]() {
            return getDependencyConfig();
          },
        },
        commands: acc.commands.concat(
          get(config, 'commands', []).map(pathToCommand =>
            path.join(dependencyName, pathToCommand),
          ),
        ),
        /**
         * Note: In this context, a `platform` is a valid target that we can
         * link dependencies for.
         *
         * This is impossible when either `projectConfig` and `dependencyConfig` are
         * not provided hence the `pickBy` check.
         */
        platforms: {
          ...acc.platforms,
          ...pickBy(
            availablePlatforms,
            (platform: PlatformsT) =>
              typeof platform.dependencyConfig === 'function' &&
              typeof platform.projectConfig === 'function' &&
              typeof platform.linkConfig === 'function',
          ),
        },
        haste: {
          providesModuleNodeModules: acc.haste.providesModuleNodeModules.concat(
            Object.keys(availablePlatforms).length > 0 ? dependencyName : [],
          ),
          platforms: [
            ...acc.haste.platforms,
            ...Object.keys(availablePlatforms),
          ],
        },
      };
    },
    ({
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
    }: DependenciesConfigT),
  );

  /**
   * Default configuration can be overriden by a project
   */
  return merge(
    {...defaultConfig, root: process.cwd()},
    readProjectConfigFromDisk(),
  );
}

export default loadConfig;
