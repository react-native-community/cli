/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ContextT } from '../core/types.flow';
import type { CommandLineArgs } from './bundleCommandLineArgs';

const Server = require('metro/src/Server');

const outputBundle = require('metro/src/shared/output/bundle');
const path = require('path');
const log = require('./log').out('bundle');
const saveAssets = require('./saveAssets');

const loadMetroConfig = require('../util/loadMetroConfig');

async function buildBundle(
  args: CommandLineArgs,
  ctx: ContextT,
  output: typeof outputBundle = outputBundle
) {
  const config = await loadMetroConfig(ctx.root, {
    resetCache: args.resetCache,
    config: args.config,
  });

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

    await output.save(bundle, args, log);

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

module.exports = buildBundle;
