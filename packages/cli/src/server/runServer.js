/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Metro from 'metro';

import { Terminal } from 'metro-core';

import morgan from 'morgan';
import path from 'path';
import type { ContextT } from '../core/types.flow';
import messageSocket from './util/messageSocket';
import webSocketProxy from './util/webSocketProxy';
import MiddlewareManager from './middleware/MiddlewareManager';

import loadMetroConfig from '../util/loadMetroConfig';

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

async function runServer(argv: *, ctx: ContextT, args: Args) {
  const terminal = new Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath || null);
  const reporter = new ReporterImpl(terminal);

  const metroConfig = await loadMetroConfig(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: args.port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    sourceExts: args.sourceExts,
    reporter,
  });

  const middlewareManager = new MiddlewareManager({
    host: args.host,
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
  });

  middlewareManager.getConnectInstance().use(morgan('combined'));

  metroConfig.watchFolders.forEach(
    middlewareManager.serveStatic.bind(middlewareManager)
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
    '/debugger-proxy'
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
    /* $FlowFixMe: can't type dynamic require */
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    /* $FlowFixMe: can't type dynamic require */
    return require(path.resolve(customLogReporterPath));
  }
}

module.exports = runServer;
