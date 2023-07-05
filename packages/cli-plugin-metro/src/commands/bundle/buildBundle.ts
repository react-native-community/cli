/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import Server from 'metro/src/Server';
import outputBundle from 'metro/src/shared/output/bundle';
import type {BundleOptions} from 'metro/src/shared/types';
import type {ConfigT} from 'metro-config';
import path from 'path';
import chalk from 'chalk';
import {CommandLineArgs} from './bundleCommandLineArgs';
import type {Config} from '@react-native-community/cli-types';
import saveAssets from './saveAssets';
import {default as loadMetroConfig} from '../../tools/loadMetroConfig';
import {logger} from '@react-native-community/cli-tools';
import type {AssetData} from 'metro';
import saveAssetsAndroid from './saveAssetsAndroid';
import saveAssetsDefault from './saveAssetsDefault';
import saveAssetsIOS from './saveAssetsIOS';

interface RequestOptions {
  entryFile: string;
  sourceMapUrl: string | undefined;
  dev: boolean;
  minify: boolean;
  platform: string;
  unstable_transformProfile: BundleOptions['unstable_transformProfile'];
}

async function buildBundle(
  args: CommandLineArgs,
  ctx: Config,
  output: typeof outputBundle = outputBundle,
) {
  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  let saveAssetsPlugin =
    ctx.platforms[args.platform] &&
    ctx.platforms[args.platform].saveAssetsPlugin
      ? require(require.resolve(
          ctx.platforms[args.platform].saveAssetsPlugin!,
          {
            paths: [ctx.root],
          },
        ))
      : undefined;

  return buildBundleWithConfig(args, config, output, saveAssetsPlugin);
}

/**
 * Create a bundle using a pre-loaded Metro config. The config can be
 * re-used for several bundling calls if multiple platforms are being
 * bundled.
 */
export async function buildBundleWithConfig(
  args: CommandLineArgs,
  config: ConfigT,
  output: typeof outputBundle = outputBundle,
  saveAssetsPlugin: (
    assets: ReadonlyArray<AssetData>,
    platform: string,
    assetsDest: string | undefined,
    assetCatalogDest: string | undefined,
    addAssetToCopy: (
      asset: AssetData,
      allowedScales: number[] | undefined,
      getAssetDestPath: (asset: AssetData, scale: number) => string,
    ) => void,
  ) => void,
) {
  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    logger.error(
      `Invalid platform ${
        args.platform ? `"${chalk.bold(args.platform)}" ` : ''
      }selected.`,
    );

    logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map((x) => `"${chalk.bold(x)}"`)
        .join(
          ', ',
        )}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`,
    );

    throw new Error('Bundling failed');
  }

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const requestOpts: RequestOptions = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile as BundleOptions['unstable_transformProfile'],
  };
  const server = new Server(config);

  try {
    const bundle = await output.build(server, requestOpts);

    await output.save(bundle, args, logger.info);

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    if (!saveAssetsPlugin) {
      saveAssetsPlugin =
        args.platform === 'ios'
          ? saveAssetsIOS
          : args.platform === 'android'
          ? saveAssetsAndroid
          : saveAssetsDefault;
    }

    // When we're done saving bundle output and the assets, we're done.
    return await saveAssets(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest,
      saveAssetsPlugin,
    );
  } finally {
    server.end();
  }
}

export default buildBundle;
