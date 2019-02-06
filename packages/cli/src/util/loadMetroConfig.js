/**
 * Configuration file of Metro.
 * @flow
 */
import type { ConfigT } from 'metro-config/src/configTypes.flow';
import path from 'path';
import { createBlacklist } from 'metro';
import { loadConfig } from 'metro-config';
import type { ContextT } from '../core/types.flow';
import findPlugins from '../core/findPlugins';
import findSymlinkedModules from './findSymlinkedModules';

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
const getDefaultConfig = (ctx: ContextT) => {
  const plugins = findPlugins(ctx.root);

  return {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      blacklistRE: getBlacklistRE(),
      platforms: ['ios', 'android', 'native', ...plugins.haste.platforms],
      providesModuleNodeModules: [
        'react-native',
        ...plugins.haste.providesModuleNodeModules,
      ],
      hasteImplModulePath: path.join(ctx.reactNativePath, 'jest/hasteImpl'),
    },
    serializer: {
      getModulesRunBeforeMainModule: () => [
        path.join(ctx.reactNativePath, 'Libraries/Core/InitializeCore'),
      ],
      getPolyfills: () =>
        require(path.join(ctx.reactNativePath, 'rn-get-polyfills'))(),
    },
    server: {
      port: process.env.RCT_METRO_PORT || 8081,
    },
    transformer: {
      babelTransformerPath: require.resolve(
        'metro-react-native-babel-transformer'
      ),
      assetRegistryPath: path.join(
        ctx.reactNativePath,
        'Libraries/Image/AssetRegistry'
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
 * Loads Metro Config and applies `options` on top of the resolved config.
 *
 * This allows the CLI to always overwrite the file settings.
 */
module.exports = async function load(
  ctx: ContextT,
  options?: ConfigOptionsT = {}
): Promise<ConfigT> {
  const defaultConfig = getDefaultConfig(ctx);

  const config = await loadConfig(
    {
      cwd: ctx.root,
      ...options,
    },
    defaultConfig
  );

  return config;
};
