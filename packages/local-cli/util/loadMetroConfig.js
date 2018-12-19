/**
 * @flow
 */
/* eslint-disable no-param-reassign */
/**
 * Configuration file of Metro.
 */
import type { ConfigT } from 'metro-config/src/configTypes.flow';

const path = require('path');

const { createBlacklist } = require('metro');
const { loadConfig } = require('metro-config');
const findSymlinkedModules = require('./findSymlinkedModules');

const findPlugins = require('../core/findPlugins');

const resolveSymlinksForRoots = roots =>
  roots.reduce<string[]>(
    (arr, rootPath) => arr.concat(findSymlinkedModules(rootPath, roots)),
    [...roots]
  );

const getWatchFolders = () => {
  const root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return resolveSymlinksForRoots([path.resolve(root)]);
  }
  return [];
};

const getBlacklistRE = () => createBlacklist([/.*\/__fixtures__\/.*/]);

/**
 * Default configuration
 *
 * @todo(grabbou): As a separate PR, haste.platforms should be added before "native".
 * Otherwise, a.native.js will not load on Windows or other platforms
 */
const getDefaultConfig = (root: string) => {
  const plugins = findPlugins(root);

  return {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      blacklistRE: getBlacklistRE(),
      platforms: ['ios', 'android', 'native', ...plugins.haste.platforms],
      providesModuleNodeModules: [
        'react-native',
        ...plugins.haste.providesModuleNodeModules,
      ],
      hasteImplModulePath: require.resolve('react-native/jest/hasteImpl'),
    },
    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve('react-native/Libraries/Core/InitializeCore'),
      ],
      getPolyfills: require('react-native/rn-get-polyfills'),
    },
    server: {
      port: process.env.RCT_METRO_PORT || 8081,
    },
    transformer: {
      babelTransformerPath: require.resolve(
        'metro-react-native-babel-transformer'
      ),
      assetRegistryPath: require.resolve(
        'react-native/Libraries/Image/AssetRegistry'
      ),
    },
    watchFolders: getWatchFolders(),
  };
};

export type ConfigOptionsT = {
  maxWorkers?: number,
  port?: number,
  resetCache?: boolean,
  watchFolders?: string[],
  sourceExts?: string[],
  reporter?: any, // eslint-disable-line flowtype/no-weak-types
  config?: string,
};

/**
 * Overwrites Metro configuration with options.
 *
 * This ensures that options are always taking precedence over other
 * configuration present.
 */
const overwriteWithOptions = (config: ConfigT, options: ConfigOptionsT) => {
  if (options.maxWorkers) {
    config.maxWorkers = options.maxWorkers;
  }

  if (options.port) {
    config.server.port = options.port;
  }

  if (options.reporter) {
    config.reporter = options.reporter;
  }

  if (options.resetCache) {
    config.resetCache = options.resetCache;
  }

  if (options.watchFolders) {
    config.watchFolders = options.watchFolders;
  }

  if (options.sourceExts && options.sourceExts !== config.resolver.sourceExts) {
    config.resolver.sourceExts = options.sourceExts.concat(
      config.resolver.sourceExts
    );
  }
};

/**
 * Loads Metro Config and applies `options` on top of the resolved config.
 *
 * This allows the CLI to always overwrite the file settings.
 */
module.exports = async function load(
  projectRoot: string,
  options?: ConfigOptionsT = {}
): Promise<ConfigT> {
  const defaultConfig = getDefaultConfig(projectRoot);

  const config = await loadConfig(
    {
      cwd: projectRoot,
      config: options.config,
    },
    defaultConfig
  );

  if (options) {
    overwriteWithOptions(config, options);
  }

  return config;
};
