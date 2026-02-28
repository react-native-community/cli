import fs from 'fs';
import {promises as fsPromises} from 'fs';
import path from 'path';
import {
  UserDependencyConfig,
  ProjectConfig,
  DependencyConfig,
  UserConfig,
  Config,
  Command,
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
  readConfigFromDiskAsync,
  readDependencyConfigFromDisk,
  readDependencyConfigFromDiskAsync,
} from './readConfigFromDisk';
import assign from './assign';
import merge from './merge';

function getDependencyConfig(
  root: string,
  dependencyName: string,
  finalConfig: Config,
  config: UserDependencyConfig,
  userConfig: UserConfig,
): DependencyConfig {
  const {autolinkTransitiveDependencies} = config.dependency;

  return merge(
    {
      root,
      name: dependencyName,
      ...(autolinkTransitiveDependencies !== undefined
        ? {autolinkTransitiveDependencies}
        : {}),
      platforms: Object.keys(finalConfig.platforms).reduce(
        (dependency, platform) => {
          const platformConfig = finalConfig.platforms[platform];
          dependency[platform] =
            // Linking platforms is not supported
            Object.keys(config.platforms).length > 0 || !platformConfig
              ? null
              : platformConfig.dependencyConfig(
                  root,
                  config.dependency.platforms?.[platform],
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

const removeDuplicateCommands = <T extends boolean>(commands: Command<T>[]) => {
  const uniqueCommandsMap = new Map();

  commands.forEach((command) => {
    uniqueCommandsMap.set(command.name, command);
  });

  return Array.from(uniqueCommandsMap.values());
};

const getUserAutolinkOverride = (
  dependencyName: string,
  userConfig: UserConfig,
) => {
  const userDependencyConfig = userConfig.dependencies[dependencyName];
  if (
    userDependencyConfig &&
    typeof userDependencyConfig === 'object' &&
    Object.prototype.hasOwnProperty.call(
      userDependencyConfig,
      'autolinkTransitiveDependencies',
    )
  ) {
    const value = userDependencyConfig.autolinkTransitiveDependencies;
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
};

const shouldAutolinkTransitiveDependencies = (
  dependencyName: string,
  dependencyConfig: UserDependencyConfig,
  userConfig: UserConfig,
) => {
  const override = getUserAutolinkOverride(dependencyName, userConfig);
  if (typeof override === 'boolean') {
    return override;
  }

  return dependencyConfig.dependency.autolinkTransitiveDependencies === true;
};

const getPeerDependenciesSync = (dependencyRoot: string) => {
  try {
    const packageJsonPath = path.join(dependencyRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return Object.keys(packageJson.peerDependencies || {});
  } catch {
    return [];
  }
};

const getPeerDependenciesAsync = async (dependencyRoot: string) => {
  try {
    const packageJsonPath = path.join(dependencyRoot, 'package.json');
    const packageJson = JSON.parse(
      await fsPromises.readFile(packageJsonPath, 'utf8'),
    );
    return Object.keys(packageJson.peerDependencies || {});
  } catch {
    return [];
  }
};

/**
 * Loads CLI configuration
 */
export default function loadConfig({
  projectRoot = findProjectRoot(),
  selectedPlatform,
}: {
  projectRoot?: string;
  selectedPlatform?: string;
}): Config {
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
    healthChecks: userConfig.healthChecks || [],
    platforms: userConfig.platforms,
    assets: userConfig.assets,
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

  const queuedDependencies = new Set([
    ...Object.keys(userConfig.dependencies),
    ...findDependencies(projectRoot),
  ]);
  const queue = Array.from(queuedDependencies);
  const processedDependencies = new Set<string>();

  let finalConfig: Config = initialConfig;

  while (queue.length > 0) {
    const dependencyName = queue.shift() as string;

    if (processedDependencies.has(dependencyName)) {
      continue;
    }

    const currentConfig = finalConfig;

    processedDependencies.add(dependencyName);

    const localDependencyRoot =
      userConfig.dependencies[dependencyName] &&
      userConfig.dependencies[dependencyName].root;
    try {
      const root =
        localDependencyRoot ||
        resolveNodeModuleDir(projectRoot, dependencyName);
      const dependencyConfig = readDependencyConfigFromDisk(
        root,
        dependencyName,
      );

      const nextConfig = assign({}, currentConfig, {
        dependencies: assign({}, currentConfig.dependencies, {
          get [dependencyName](): DependencyConfig {
            return getDependencyConfig(
              root,
              dependencyName,
              finalConfig,
              dependencyConfig,
              userConfig,
            );
          },
        }),
        commands: removeDuplicateCommands([
          ...dependencyConfig.commands,
          ...currentConfig.commands,
        ]),
        platforms: {
          ...currentConfig.platforms,
          ...(selectedPlatform && dependencyConfig.platforms[selectedPlatform]
            ? {[selectedPlatform]: dependencyConfig.platforms[selectedPlatform]}
            : !selectedPlatform
            ? dependencyConfig.platforms
            : undefined),
        },
        healthChecks: [
          ...currentConfig.healthChecks,
          ...dependencyConfig.healthChecks,
        ],
      }) as Config;

      finalConfig = nextConfig;

      if (
        shouldAutolinkTransitiveDependencies(
          dependencyName,
          dependencyConfig,
          userConfig,
        )
      ) {
        const peerDependencies = getPeerDependenciesSync(root);
        for (const peerDependency of peerDependencies) {
          if (!queuedDependencies.has(peerDependency)) {
            queuedDependencies.add(peerDependency);
            queue.push(peerDependency);
          }
        }
      }
    } catch {
      continue;
    }
  }

  return finalConfig;
}

/**
 * Load CLI configuration asynchronously, which supports reading ESM modules.
 */

export async function loadConfigAsync({
  projectRoot = findProjectRoot(),
  selectedPlatform,
}: {
  projectRoot?: string;
  selectedPlatform?: string;
}): Promise<Config> {
  let lazyProject: ProjectConfig;
  const userConfig = await readConfigFromDiskAsync(projectRoot);

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
    healthChecks: userConfig.healthChecks || [],
    platforms: userConfig.platforms,
    assets: userConfig.assets,
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

  const queuedDependencies = new Set([
    ...Object.keys(userConfig.dependencies),
    ...findDependencies(projectRoot),
  ]);
  const queue = Array.from(queuedDependencies);
  const processedDependencies = new Set<string>();

  let finalConfig: Config = initialConfig;

  while (queue.length > 0) {
    const dependencyName = queue.shift() as string;

    if (processedDependencies.has(dependencyName)) {
      continue;
    }

    const currentConfig = finalConfig;

    processedDependencies.add(dependencyName);

    const localDependencyRoot =
      userConfig.dependencies[dependencyName] &&
      userConfig.dependencies[dependencyName].root;
    try {
      const root =
        localDependencyRoot ||
        resolveNodeModuleDir(projectRoot, dependencyName);
      const dependencyConfig = await readDependencyConfigFromDiskAsync(
        root,
        dependencyName,
      );

      const nextConfig = assign({}, currentConfig, {
        dependencies: assign({}, currentConfig.dependencies, {
          get [dependencyName](): DependencyConfig {
            return getDependencyConfig(
              root,
              dependencyName,
              finalConfig,
              dependencyConfig,
              userConfig,
            );
          },
        }),
        commands: removeDuplicateCommands([
          ...dependencyConfig.commands,
          ...currentConfig.commands,
        ]),
        platforms: {
          ...currentConfig.platforms,
          ...(selectedPlatform && dependencyConfig.platforms[selectedPlatform]
            ? {[selectedPlatform]: dependencyConfig.platforms[selectedPlatform]}
            : !selectedPlatform
            ? dependencyConfig.platforms
            : undefined),
        },
        healthChecks: [
          ...currentConfig.healthChecks,
          ...dependencyConfig.healthChecks,
        ],
      }) as Config;

      finalConfig = nextConfig;

      if (
        shouldAutolinkTransitiveDependencies(
          dependencyName,
          dependencyConfig,
          userConfig,
        )
      ) {
        const peerDependencies = await getPeerDependenciesAsync(root);
        for (const peerDependency of peerDependencies) {
          if (!queuedDependencies.has(peerDependency)) {
            queuedDependencies.add(peerDependency);
            queue.push(peerDependency);
          }
        }
      }
    } catch {
      continue;
    }
  }

  return finalConfig;
}
