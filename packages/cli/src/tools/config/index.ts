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
    haste: {
      providesModuleNodeModules: [],
      platforms: Object.keys(userConfig.platforms),
    },
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

  let depsWithWarnings: Array<[string, string]> = [];

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
      const output = readDependencyConfigFromDisk(root);
      config = output.config;

      if (output.legacy && !localDependencyRoot) {
        const pkg = require(path.join(root, 'package.json'));
        const link =
          pkg.homepage || `https://npmjs.com/package/${dependencyName}`;
        depsWithWarnings.push([dependencyName, link]);
      }
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

    /**
     * Legacy `rnpm` config required `haste` to be defined. With new config,
     * we do it automatically.
     *
     * @todo: Remove this once `rnpm` config is deprecated and all major RN libs are converted.
     */
    const haste = config.haste || {
      providesModuleNodeModules: isPlatform ? [dependencyName] : [],
      platforms: Object.keys(config.platforms),
    };

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
      haste: {
        providesModuleNodeModules: [
          ...acc.haste.providesModuleNodeModules,
          ...haste.providesModuleNodeModules,
        ],
        platforms: [...acc.haste.platforms, ...haste.platforms],
      },
    }) as Config;
  }, initialConfig);

  if (depsWithWarnings.length) {
    logger.warn(
      `The following packages use deprecated "rnpm" config that will stop working from next release:\n${depsWithWarnings
        .map(
          ([name, link]) =>
            `  - ${chalk.bold(name)}: ${chalk.dim(chalk.underline(link))}`,
        )
        .join(
          '\n',
        )}\nPlease notify their maintainers about it. You can find more details at ${chalk.dim.underline(
        'https://github.com/react-native-community/cli/blob/master/docs/configuration.md#migration-guide',
      )}.`,
    );
  }

  return finalConfig;
}

export default loadConfig;
