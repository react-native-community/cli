/**
 * Configuration file of Metro.
 */
import path from 'path';
// @ts-ignore - no typed definition for the package
import {createBlacklist} from 'metro';
// @ts-ignore - no typed definition for the package
import {loadConfig} from 'metro-config';
import {Config} from '@react-native-community/cli-types';
import findSymlinkedModules from './findSymlinkedModules';

function resolveSymlinksForRoots(roots: string[]): string[] {
  return roots.reduce<string[]>(
    (arr, rootPath) => arr.concat(findSymlinkedModules(rootPath, roots)),
    [...roots],
  );
}

function getWatchFolders(): string[] {
  const root = process.env.REACT_NATIVE_APP_ROOT;
  return root ? resolveSymlinksForRoots([path.resolve(root)]) : [];
}

const getBlacklistRE: () => RegExp = () =>
  createBlacklist([/.*\/__fixtures__\/.*/]);

const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/node_modules/react-devtools-core/.+\\.js$',
  ].join('|'),
);

export interface MetroConfig {
  resolver: {
    resolverMainFields: string[];
    blacklistRE: RegExp;
    platforms: string[];
  };
  serializer: {
    getModulesRunBeforeMainModule: () => string[];
    getPolyfills: () => any;
  };
  server: {
    port: number;
    enhanceMiddleware?: Function;
  };
  symbolicator: {
    customizeFrame: (frame: {file: string | null}) => {collapse: boolean};
  };
  transformer: {
    babelTransformerPath: string;
    assetRegistryPath: string;
    assetPlugins?: Array<string>;
  };
  watchFolders: string[];
  reporter?: any;
}

/**
 * Options that can be used to tweak the default configuration
 * that is later passed to Metro
 */
type DefaultConfigOptions = {
  port?: number;
  reporter?: any;
};

/**
 * Options that change the behaviour of Metro built-in `loadConfig`
 * function
 *
 * Details here: https://github.com/facebook/metro/blob/master/packages/metro-config/src/loadConfig.js#L28-L45
 */
export type ConfigOptions = DefaultConfigOptions & {
  resetCache?: boolean;
  config?: string;
};

/**
 * Default configuration
 */
export const getDefaultConfig = (
  ctx: Config,
  opts: DefaultConfigOptions,
): MetroConfig => {
  const hasteImplPath = path.join(ctx.reactNativePath, 'jest/hasteImpl.js');
  return {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      blacklistRE: getBlacklistRE(),
      platforms: [...Object.keys(ctx.platforms), 'native'],
    },
    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve(
          path.join(ctx.reactNativePath, 'Libraries/Core/InitializeCore'),
        ),
      ],
      getPolyfills: () =>
        require(path.join(ctx.reactNativePath, 'rn-get-polyfills'))(),
    },
    server: {
      port: Number(process.env.RCT_METRO_PORT) || opts.port || 8081,
    },
    symbolicator: {
      customizeFrame: (frame: {file: string | null}) => {
        const collapse = Boolean(
          frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file),
        );
        return {collapse};
      },
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
    reporter: opts.reporter,
  };
};

/**
 * Loads Metro Config and applies `options` on top of the resolved config.
 *
 * This allows the CLI to always overwrite the file settings.
 */
export default function load(
  ctx: Config,
  opts: ConfigOptions = {},
): Promise<MetroConfig> {
  const defaultConfig = getDefaultConfig(ctx, opts);
  return loadConfig(
    {cwd: ctx.root, resetCache: opts.resetCache, config: opts.config},
    defaultConfig,
  );
}
