/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Server from 'metro/src/Server';

import outputBundle from 'metro/src/shared/output/bundle';
import path from 'path';
import chalk from 'chalk';
import type {CommandLineArgs} from './bundleCommandLineArgs';
import type {ConfigT} from '../../tools/config/types.flow';
import saveAssets from './saveAssets';
import loadMetroConfig from '../../tools/loadMetroConfig';
import {logger} from '@react-native-community/cli-tools';

async function buildBundle(
  args: CommandLineArgs,
  ctx: ConfigT,
  output: typeof outputBundle = outputBundle,
) {
  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    logger.error(
      `Invalid platform ${
        args.platform ? `"${chalk.bold(args.platform)}" ` : ''
      }selected.`,
    );

    logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map(x => `"${chalk.bold(x)}"`)
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

    // When we're done saving bundle output and the assets, we're done.
    return await saveAssets(outputAssets, args.platform, args.assetsDest);
  } finally {
    server.end();
  }
}

export default buildBundle;
