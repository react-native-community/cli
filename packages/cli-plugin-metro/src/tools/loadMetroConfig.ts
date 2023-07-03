import fs from 'fs';
import path from 'path';
import {
  ConfigT,
  InputConfigT,
  loadConfig,
  mergeConfig,
  resolveConfig,
  ResolverConfigT,
} from 'metro-config';
import {CLIError, logger} from '@react-native-community/cli-tools';
import type {Config} from '@react-native-community/cli-types';
import getDefaultMetroConfig from './getDefaultMetroConfig';
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
  const resolver: Partial<ResolverConfigT> = {
    platforms: [...Object.keys(ctx.platforms), 'native'],
  };

  if (outOfTreePlatforms.length) {
    resolver.resolveRequest = reactNativePlatformResolver(
      outOfTreePlatforms.reduce<{[platform: string]: string}>(
        (result, platform) => {
          result[platform] = ctx.platforms[platform].npmPackageName!;
          return result;
        },
        {},
      ),
    );
  }

  return {
    resolver,
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
              .npmPackageName!}/Libraries/Core/InitializeCore`, {paths: [ctx.root]}
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
 * Allows the CLI to override select values in `metro.config.js` based on
 * dynamic user options in `ctx`.
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

  if (projectConfig.isEmpty) {
    throw new CLIError(`No metro config found in ${ctx.root}`);
  }

  logger.debug(`Reading Metro config from ${projectConfig.filepath}`);

  if (
    !/['"']@react-native\/metro-config['"']/.test(
      fs.readFileSync(projectConfig.filepath, 'utf8'),
    )
  ) {
    logger.warn(
      'From React Native 0.72, your metro.config.js file should extend' +
        "'@react-native/metro-config'. Please see the React Native 0.72 " +
        'changelog, or copy the template at:\n' +
        'https://github.com/facebook/react-native/blob/main/packages/react-native/template/metro.config.js',
    );
    logger.warn('Falling back to internal defaults.');

    const loadedConfig = await loadConfig(
      {cwd: ctx.root, ...options},
      // Provide React Native defaults on top of Metro defaults
      getDefaultMetroConfig(ctx),
    );

    return mergeConfig(loadedConfig, overrideConfig);
  }

  return mergeConfig(
    await loadConfig({cwd: ctx.root, ...options}),
    overrideConfig,
  );
}
