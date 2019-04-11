/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Metro from 'metro';
import {Terminal} from 'metro-core';
import morgan from 'morgan';
import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import type {ConfigT} from '../../tools/config/types.flow';
import messageSocket from './messageSocket';
import webSocketProxy from './webSocketProxy';
import MiddlewareManager from './middleware/MiddlewareManager';
import loadMetroConfig from '../../tools/loadMetroConfig';

export type Args = {|
  assetExts?: string[],
  cert?: string,
  customLogReporterPath?: string,
  host?: string,
  https?: boolean,
  maxWorkers?: number,
  key?: string,
  nonPersistent?: boolean,
  platforms?: string[],
  port?: number,
  providesModuleNodeModules?: string[],
  resetCache?: boolean,
  sourceExts?: string[],
  transformer?: string,
  verbose?: boolean,
  watchFolders?: string[],
  config?: string,
|};

async function runServer(argv: Array<string>, ctx: ConfigT, args: Args) {
  const terminal = new Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath || null);
  const reporter = new ReporterImpl(terminal);

  const metroConfig = await loadMetroConfig(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: args.port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: ctx.root,
    sourceExts: args.sourceExts,
    reporter,
  });

  const middlewareManager = new MiddlewareManager({
    host: args.host,
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
  });

  middlewareManager.getConnectInstance().use(
    morgan(
      'combined',
      !logger.isVerbose() && {
        skip: (req, res) => res.statusCode < 400,
      },
    ),
  );

  metroConfig.watchFolders.forEach(
    middlewareManager.serveStatic.bind(middlewareManager),
  );

  metroConfig.server.enhanceMiddleware = middleware =>
    middlewareManager.getConnectInstance().use(middleware);

  const serverInstance = await Metro.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    hmrEnabled: true,
  });

  const wsProxy = webSocketProxy.attachToServer(
    serverInstance,
    '/debugger-proxy',
  );
  const ms = messageSocket.attachToServer(serverInstance, '/message');
  middlewareManager.attachDevToolsSocket(wsProxy);
  middlewareManager.attachDevToolsSocket(ms);

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
}

function getReporterImpl(customLogReporterPath: ?string) {
  if (customLogReporterPath == null) {
    return require('metro/src/lib/TerminalReporter');
  }
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    return require(path.resolve(customLogReporterPath));
  }
}

export default runServer;
