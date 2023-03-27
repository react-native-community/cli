import path from 'path';
import {ConfigT, InputConfigT, loadConfig, resolveConfig} from 'metro-config';
import {CLIError, logger} from '@react-native-community/cli-tools';
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
export default async function loadMetroConfig(
  ctx: ConfigLoadingContext,
  options: ConfigOptionsT = {},
): Promise<ConfigT> {
  const overrideConfig = getOverrideConfig(ctx);
  if (options.reporter) {
    overrideConfig.reporter = options.reporter;
  }

  const projectConfig = await resolveConfig(undefined, ctx.root);

  // @ts-ignore resolveConfig return value is mistyped
  if (projectConfig.isEmpty) {
    throw new CLIError(`No metro config found in ${ctx.root}`);
  }

  // @ts-ignore resolveConfig return value is mistyped
  logger.debug(`Reading Metro config from ${projectConfig.filepath}`);

  try {
    require.resolve('@react-native/metro-config', {
      paths: [ctx.root],
    });
  } catch (e) {
    console.warn(
      'warning: From React Native 0.72, your metro.config.js file should ' +
        "extend '@react-native/metro-config', however this is not in your " +
        "project's devDependencies.",
    );
  }

  return loadConfig({cwd: ctx.root, ...options}, overrideConfig);
}
