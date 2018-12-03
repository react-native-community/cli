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
const findReactNativePath = require('./findReactNativePath');
const path = require('path');

const {createBlacklist} = require('metro');
const {loadConfig} = require('metro-config');

const findPlugins = require('../core/findPlugins');

/**
 * Configuration file of Metro.
 */
import type {ConfigT} from 'metro-config/src/configTypes.flow';

function getProjectRoot() {
  /*
   * React Native was installed using CocoaPods.
   * 
   * @todo(grabbou): Check if this still holds true now that we have sep. package
   */
  if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
    return path.resolve(__dirname, '../../../..');
  }
  /**
   * Packager is running from `node_modules`.
   * This is the default case for all projects created using 'react-native init'.
   */
  return path.resolve(__dirname, '../../');
}

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

const plugins = findPlugins()

/**
 * Default configuration
 */
const getDefaultConfig = () => ({
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main'],
    blacklistRE: getBlacklistRE(),
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    hasteImplModulePath: require.resolve('react-native/jest/hasteImpl')
  },
  serializer: {
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],
    getPolyfills: require.resolve('react-native/rn-get-polyfills'),
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
  projectRoot?: string,
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
module.exports = async function load(options: ConfigOptionsT): Promise<ConfigT> {
  const argv = {cwd: getProjectRoot()};
  const plugins = findPlugins(argv.cwd);

  const config = await loadConfig(argv, getDefaultConfig());

  const platforms = ['ios', 'android', 'native', ...plugins.haste.platforms];
  const providesModuleNodeModules = ['react-native', ...plugins.haste.providesModuleNodeModules];
  
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

  if (options.projectRoot) {
    config.projectRoot = options.projectRoot;
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

  config.resolver.platforms = config.resolver.platforms
    ? config.resolver.platforms.concat(platforms)
    : platforms;

  config.resolver.providesModuleNodeModules = config.resolver.providesModuleNodeModules
    ? config.resolver.providesModuleNodeModules.concat(providesModuleNodeModules)
    : providesModuleNodeModules;

  return config;
};
