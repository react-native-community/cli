/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const findSymlinkedModules = require('./findSymlinkedModules');
const path = require('path');

const {createBlacklist} = require('metro');
const {loadConfig} = require('metro-config');

const findPlugins = require('../core/findPlugins');

/**
 * Configuration file of Metro.
 */
import type {ConfigT} from 'metro-config/src/configTypes.flow';

const resolveSymlinksForRoots = (roots) =>
  roots.reduce<string[]>(
    (arr, rootPath) => arr.concat(findSymlinkedModules(rootPath, roots)),
    [...roots],
  );

const getWatchFolders = () => {
  const root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return resolveSymlinksForRoots([path.resolve(root)]);
  }
  return [];
};

const getBlacklistRE = () => {
  return createBlacklist([/.*\/__fixtures__\/.*/]);
};

/**
 * Default configuration
 */
const getDefaultConfig = () => ({
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main'],
    blacklistRE: getBlacklistRE()
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
    babelTransformerPath: require.resolve('metro/src/reactNativeTransformer'),
  },
  watchFolders: getWatchFolders(),
});

export type ConfigOptionsT = {
  maxWorkers?: number,
  port?: number,
  resetCache?: boolean,
  watchFolders?: string[],
  sourceExts?: string[],
  reporter: any,
};

/**
 * Loads Metro Config and applies `options` on top of the resolved config.
 * 
 * This allows the CLI to always overwrite the file settings.
 * 
 * @todo(grabbou): Is this really how we want it? 
 * Is it breaking to just use "defaults"?
 */
module.exports = async function load(projectRoot: string, options: ConfigOptionsT): Promise<ConfigT> {
  const plugins = findPlugins(projectRoot);

  const config = await loadConfig({cwd: projectRoot}, getDefaultConfig());

  config.transformer.assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
  
  config.resolver.hasteImplModulePath =
    config.resolver.hasteImplModulePath || require.resolve('react-native/jest/hasteImpl');

  config.resolver.platforms = config.resolver.platforms
    .concat(plugins.haste.platforms);

  config.resolver.providesModuleNodeModules = config.resolver.providesModuleNodeModules
    .concat(plugins.haste.providesModuleNodeModules);

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

  if (
    options.sourceExts
    && options.sourceExts !== config.resolver.sourceExts
  ) {
    config.resolver.sourceExts = options.sourceExts.concat(
      config.resolver.sourceExts,
    );
  }

  return config;
};
