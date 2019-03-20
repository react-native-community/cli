/**
 * @flow
 */
import comsmiconfig from 'cosmiconfig';
import path from 'path';
import merge from 'deepmerge';
import {get} from 'lodash';

import getProjectDependencies from '../../commands/link/getProjectDependencies';

const explorer = comsmiconfig('react-native');

type DependencyConfig = {
  ios: ?DependencyConfigIOS,
  android: ?DependencyConfigAndroid,
};

type DependencyConfigIOS = DetectedDependencyConfigIOS & {
  project?: string,
};

type DetectedDependencyConfigIOS = {
  podspec: string,
};

type DependencyConfigAndroid = DetectedDependencyConfigAndroid & {
  sourceDir?: string,
  manifestPath?: string,
  packageName?: string,
  packageClassName?: string,
};

type DetectedDependencyConfigAndroid = {
  packageImportPath: string,
  packageInstance: string,
};

type PlatformConfig<T, K> = {
  getDependencyConfig: (string, T) => ?K,
};

type Platforms = {
  [key: string]: PlatformConfig<*>,
  ios: PlatformConfig<DependencyConfigIOS, DetectedDependencyConfigIOS>,
  android: PlatformConfig<DependencyConfigAndroid, DetectedDependencyAndroid>,
};

type ProjectConfig = {
  root: string,
  reactNativePath: string,
  dependencies: {
    [key: string]: DependencyConfig,
  },
};

type Options = {
  root: ?string,
};

const defaultOptions = {
  root: process.cwd(),
};

function readConfigFromDisk(root: string) {
  const {config} = explorer.searchSync(root) || {config: {}};
  return config;
}

function getDefaultConfig(config: ProjectConfig, root: string) {
  const platforms: Platforms = {
    ios: {
      getDependencyConfig: require('../ios').getDependencyConfig,
    },
    android: {
      getDependencyConfig: require('../android').getDependencyConfig,
    },
    ...config.platforms,
  };

  const dependencies = getProjectDependencies(root).reduce(
    (deps, dependency) => {
      const folder = path.join(root, 'node_modules', dependency);
      const dependencyConfig = readConfigFromDisk(folder);

      deps[dependency] = Object.keys(platforms).reduce(
        (acc, platform) => {
          const dependencyPlatformConfig = get(
            dependencyConfig,
            `dependency.${platform}`,
            {},
          );
          if (dependencyPlatformConfig === null) {
            return acc;
          }
          const detectedConfig = platforms[platform].getDependencyConfig(
            folder,
            dependencyPlatformConfig,
          );
          if (detectedConfig === null) {
            return acc;
          }
          acc[platform] = {
            ...detectedConfig,
            ...dependencyPlatformConfig,
          };
          return acc;
        },
        {
          ios: null,
          android: null,
        },
      );
      return deps;
    },
    {},
  );

  return merge(
    {
      dependencies,
    },
    config,
  );
}

async function loadConfig(opts: Options = defaultOptions): ProjectConfig {
  const config = readConfigFromDisk(opts.root);

  return {
    ...getDefaultConfig(config, opts.root),
    root: opts.root,
    reactNativePath: config.reactNativePath
      ? path.resolve(config.reactNativePath)
      : (() => {
          try {
            return path.dirname(
              // $FlowIssue: Wrong `require.resolve` type definition
              require.resolve('react-native/package.json', {
                paths: [opts.root],
              }),
            );
          } catch (_ignored) {
            throw new Error(
              'Unable to find React Native files. Make sure "react-native" module is installed in your project dependencies.',
            );
          }
        })(),
  };
}

export default loadConfig;
