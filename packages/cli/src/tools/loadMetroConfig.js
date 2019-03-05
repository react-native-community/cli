/**
 * Configuration file of Metro.
 * @flow
 */
import path from 'path';
import {createBlacklist} from 'metro';
import {loadConfig} from 'metro-config';
import type {ContextT} from './types.flow';
import findPlugins from './findPlugins';
import findSymlinkedModules from './findSymlinkedModules';

const resolveSymlinksForRoots = roots =>
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

const getBlacklistRE = () => createBlacklist([/.*\/__fixtures__\/.*/]);

/**
 * Default configuration
 *
 * @todo(grabbou): As a separate PR, haste.platforms should be added before "native".
 * Otherwise, a.native.js will not load on Windows or other platforms
 */
export const getDefaultConfig = (ctx: ContextT) => {
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
        require.resolve(
          path.join(ctx.reactNativePath, 'Libraries/tools/InitializeCore'),
        ),
      ],
      getPolyfills: () =>
        require(path.join(ctx.reactNativePath, 'rn-get-polyfills'))(),
    },
    server: {
      port: process.env.RCT_METRO_PORT || 8081,
    },
    transformer: {
      babelTransformerPath: require.resolve(
        'metro-react-native-babel-transformer',
      ),
      assetRegistryPath: path.join(
        ctx.reactNativePath,
        'Libraries/Image/AssetRegistry',
      ),
    },
    watchFolders: getWatchFolders(),
  };
};

export type ConfigOptionsT = {|
  maxWorkers?: number,
  port?: number,
  resetCache?: boolean,
  watchFolders?: string[],
  sourceExts?: string[],
  reporter?: any,
  config?: string,
|};

/**
 * Loads Metro Config and applies `options` on top of the resolved config.
 *
 * This allows the CLI to always overwrite the file settings.
 */
export default (async function load(
  ctx: ContextT,
  // $FlowFixMe - troubles with empty object being inexact
  options?: ConfigOptionsT = {},
) {
  const defaultConfig = getDefaultConfig(ctx);

  const config = await loadConfig(
    {
      cwd: ctx.root,
      ...options,
    },
    defaultConfig,
  );

  return config;
});
