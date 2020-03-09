import path from 'path';
import chalk from 'chalk';
import {
  UserDependencyConfig,
  ProjectConfig,
  Dependency,
  UserConfig,
  Config,
} from '@react-native-community/cli-types';
import {logger, inlineString} from '@react-native-community/cli-tools';
import findDependencies from './findDependencies';
import findProjectRoot from './findProjectRoot';
import resolveReactNativePath from './resolveReactNativePath';
import findAssets from './findAssets';
import {
  readConfigFromDisk,
  readDependencyConfigFromDisk,
} from './readConfigFromDisk';
import assign from '../assign';
import merge from '../merge';
import resolveNodeModuleDir from './resolveNodeModuleDir';

function getDependencyConfig(
  root: string,
  dependencyName: string,
  finalConfig: Config,
  config: UserDependencyConfig,
  userConfig: UserConfig,
  isPlatform: boolean,
): Dependency {
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
                  config.dependency.platforms[platform],
                );
          return dependency;
        },
        {} as Config['platforms'],
      ),
      assets: findAssets(root, config.dependency.assets),
      hooks: config.dependency.hooks,
      params: config.dependency.params,
    },
    userConfig.dependencies[dependencyName] || {},
  ) as Dependency;
}

/**
 * Loads CLI configuration
 */
function loadConfig(projectRoot: string = findProjectRoot()): Config {
  let lazyProject: ProjectConfig;
  const userConfig = readConfigFromDisk(projectRoot);

  const initialConfig: Config = {
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
    get project() {
      if (lazyProject) {
        return lazyProject;
      }

      lazyProject = {};
      for (const platform in finalConfig.platforms) {
        const platformConfig = finalConfig.platforms[platform];
        if (platformConfig) {
          lazyProject[platform] = platformConfig.projectConfig(
            projectRoot,
            userConfig.project[platform] || {},
          );
        }
      }

      return lazyProject;
    },
  };

  const finalConfig = Array.from(
    new Set([
      ...Object.keys(userConfig.dependencies),
      ...findDependencies(projectRoot),
    ]),
  ).reduce((acc: Config, dependencyName) => {
    const localDependencyRoot =
      userConfig.dependencies[dependencyName] &&
      userConfig.dependencies[dependencyName].root;
    let root: string;
    let config: UserDependencyConfig;
    try {
      root =
        localDependencyRoot ||
        resolveNodeModuleDir(projectRoot, dependencyName);
      config = readDependencyConfigFromDisk(root);
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

    const isPlatform = Object.keys(config.platforms).length > 0;

    return assign({}, acc, {
      dependencies: assign({}, acc.dependencies, {
        get [dependencyName](): Dependency {
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
    }) as Config;
  }, initialConfig);

  return finalConfig;
}

export default loadConfig;
