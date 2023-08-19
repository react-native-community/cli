import path from 'path';
import {
  UserDependencyConfig,
  ProjectConfig,
  DependencyConfig,
  UserConfig,
  Config,
} from '@react-native-community/cli-types';
import {
  findProjectRoot,
  version,
  resolveNodeModuleDir,
  UnknownProjectError,
} from '@react-native-community/cli-tools';
import findDependencies from './findDependencies';
import resolveReactNativePath from './resolveReactNativePath';
import {
  readConfigFromDisk,
  readDependencyConfigFromDisk,
} from './readConfigFromDisk';
import assign from './assign';
import merge from './merge';

function getDependencyConfig(
  root: string,
  dependencyName: string,
  finalConfig: Config,
  config: UserDependencyConfig,
  userConfig: UserConfig,
  isPlatform: boolean,
): DependencyConfig {
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
    },
    userConfig.dependencies[dependencyName] || {},
  ) as DependencyConfig;
}

// Try our best to figure out what version of React Native we're running. This is
// currently being used to get our deeplinks working, so it's only worried with
// the major and minor version.
function getReactNativeVersion(reactNativePath: string) {
  try {
    let semver = version.current(reactNativePath);
    if (semver) {
      // Retain only these version, since they correspond with our documentation.
      return `${semver.major}.${semver.minor}`;
    }
  } catch (e) {
    // If we don't seem to be in a well formed project, give up quietly.
    if (!(e instanceof UnknownProjectError)) {
      throw e;
    }
  }
  return 'unknown';
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
    get reactNativeVersion() {
      return getReactNativeVersion(initialConfig.reactNativePath);
    },
    dependencies: userConfig.dependencies,
    commands: userConfig.commands,
    healthChecks: [],
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
    try {
      let root =
        localDependencyRoot ||
        resolveNodeModuleDir(projectRoot, dependencyName);
      let config = readDependencyConfigFromDisk(root, dependencyName);

      const isPlatform = Object.keys(config.platforms).length > 0;

      return assign({}, acc, {
        dependencies: assign({}, acc.dependencies, {
          get [dependencyName](): DependencyConfig {
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
        healthChecks: [...acc.healthChecks, ...config.healthChecks],
      }) as Config;
    } catch {
      return acc;
    }
  }, initialConfig);

  return finalConfig;
}

export default loadConfig;
