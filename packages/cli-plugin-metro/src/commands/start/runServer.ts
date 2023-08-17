/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Metro from 'metro';
import type {Reporter, ReportableEvent} from 'metro';
import type Server from 'metro/src/Server';
import type {Middleware} from 'metro-config';
import {Terminal} from 'metro-core';
import path from 'path';
import {
  createDevServerMiddleware,
  indexPageMiddleware,
} from '@react-native-community/cli-server-api';
import {Config} from '@react-native-community/cli-types';

import loadMetroConfig from '../../tools/loadMetroConfig';
import {
  isPackagerRunning,
  logger,
  version,
  logAlreadyRunningBundler,
  handlePortUnavailable,
} from '@react-native-community/cli-tools';
import enableWatchMode from './watchMode';
import chalk from 'chalk';

export type Args = {
  assetPlugins?: string[];
  cert?: string;
  customLogReporterPath?: string;
  host?: string;
  https?: boolean;
  maxWorkers?: number;
  key?: string;
  platforms?: string[];
  port?: number;
  resetCache?: boolean;
  sourceExts?: string[];
  transformer?: string;
  watchFolders?: string[];
  config?: string;
  projectRoot?: string;
  interactive: boolean;
};

async function runServer(_argv: Array<string>, ctx: Config, args: Args) {
  let port = args.port ?? 8081;
  let packager = true;

  const packagerStatus = await isPackagerRunning(port);

  if (
    typeof packagerStatus === 'object' &&
    packagerStatus.status === 'running'
  ) {
    if (packagerStatus.root === ctx.root) {
      packager = false;
      logAlreadyRunningBundler(port);
    } else {
      const result = await handlePortUnavailable(port, ctx.root, packager);
      [port, packager] = [result.port, result.packager];
    }
  } else if (packagerStatus === 'unrecognized') {
    const result = await handlePortUnavailable(port, ctx.root, packager);
    [port, packager] = [result.port, result.packager];
  }

  if (packager === false) {
    process.exit();
  }

  const metroConfig = await loadMetroConfig(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: args.projectRoot,
    sourceExts: args.sourceExts,
  });
  // if customLogReporterPath is provided, use the custom reporter, otherwise use the default one
  let reporter: Reporter = metroConfig.reporter;
  if (args.customLogReporterPath) {
    const terminal = new Terminal(process.stdout);
    const ReporterImpl = getReporterImpl(args.customLogReporterPath);
    reporter = new ReporterImpl(terminal);
  }

  if (args.assetPlugins) {
    // @ts-ignore - assigning to readonly property
    metroConfig.transformer.assetPlugins = args.assetPlugins.map((plugin) =>
      require.resolve(plugin),
    );
  }

  const {
    middleware,
    websocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = createDevServerMiddleware({
    host: args.host,
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
  });
  middleware.use(indexPageMiddleware);

  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
  // @ts-ignore - assigning to readonly property
  metroConfig.server.enhanceMiddleware = (
    metroMiddleware: Middleware,
    server: Server,
  ) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }
    return middleware.use(metroMiddleware);
  };

  const serverInstance = await Metro.runServer(
    {
      ...metroConfig,
      reporter: {
        update(event: ReportableEvent) {
          reporter.update(event);
          // Add reportEvent to the reporter update method.
          eventsSocketEndpoint.reportEvent(event);
        },
      },
    },
    {
      host: args.host,
      secure: args.https,
      secureCert: args.cert,
      secureKey: args.key,
      // @ts-ignore - ws.Server types are incompatible
      websocketEndpoints,
    },
  );

  if (args.interactive) {
    enableWatchMode(messageSocketEndpoint, ctx);
  }

  // In Node 8, the default keep-alive for an HTTP connection is 5 seconds. In
  // early versions of Node 8, this was implemented in a buggy way which caused
  // some HTTP responses (like those containing large JS bundles) to be
  // terminated early.
  //
  // As a workaround, arbitrarily increase the keep-alive from 5 to 30 seconds,
  // which should be enough to send even the largest of JS bundles.
  //
  // For more info: https://github.com/nodejs/node/issues/13391
  //
  serverInstance.keepAliveTimeout = 30000;

  await version.logIfUpdateAvailable(ctx.root);
  logger.info(`Started dev server at ${chalk.bold(port)}`);
}

function getReporterImpl(customLogReporterPath: string) {
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    return require(customLogReporterPath);
  } catch (e) {
    if ((<any>e).code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    return require(path.resolve(customLogReporterPath));
  }
}

export default runServer;
