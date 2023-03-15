import path from 'path';
import {ConfigT, InputConfigT, loadConfig} from 'metro-config';
import type {Config} from '@react-native-community/cli-types';
import {reactNativePlatformResolver} from './metroPlatformResolver';

export type {Config};

export type ConfigLoadingContext = Pick<
  Config,
  'root' | 'reactNativePath' | 'platforms'
>;

/**
 * Get the config options to override based on RN CLI inputs.
 */
function getOverrideConfig(ctx: ConfigLoadingContext): InputConfigT {
  const outOfTreePlatforms = Object.keys(ctx.platforms).filter(
    (platform) => ctx.platforms[platform].npmPackageName,
  );

  return {
    resolver: {
      resolveRequest:
        outOfTreePlatforms.length === 0
          ? undefined
          : reactNativePlatformResolver(
              outOfTreePlatforms.reduce<{[platform: string]: string}>(
                (result, platform) => {
                  result[platform] = ctx.platforms[platform].npmPackageName!;
                  return result;
                },
                {},
              ),
            ),
      platforms: [...Object.keys(ctx.platforms), 'native'],
    },
    serializer: {
      // We can include multiple copies of InitializeCore here because metro will
      // only add ones that are already part of the bundle
      getModulesRunBeforeMainModule: () => [
        require.resolve(
          path.join(ctx.reactNativePath, 'Libraries/Core/InitializeCore'),
        ),
        ...outOfTreePlatforms.map((platform) =>
          require.resolve(
            `${ctx.platforms[platform]
              .npmPackageName!}/Libraries/Core/InitializeCore`,
          ),
        ),
      ],
    },
  };
}

export interface ConfigOptionsT {
  maxWorkers?: number;
  port?: number;
  projectRoot?: string;
  resetCache?: boolean;
  watchFolders?: string[];
  sourceExts?: string[];
  reporter?: any;
  config?: string;
}

/**
 * Load Metro config.
 *
 * Allows the CLI to override certain defaults in the base `metro.config.js`
 * based on dynamic user options in `ctx`.
 */
export default function loadMetroConfig(
  ctx: ConfigLoadingContext,
  options?: ConfigOptionsT,
): Promise<ConfigT> {
  const overrideConfig = getOverrideConfig(ctx);
  if (options && options.reporter) {
    overrideConfig.reporter = options.reporter;
  }
  return loadConfig({cwd: ctx.root, ...options}, overrideConfig);
}
