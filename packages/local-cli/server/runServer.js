/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const Metro = require('metro');

const { Terminal } = require('metro-core');

const messageSocket = require('./util/messageSocket');
const morgan = require('morgan');
const path = require('path');
const webSocketProxy = require('./util/webSocketProxy');
const MiddlewareManager = require('./middleware/MiddlewareManager');

import type { ConfigT } from '../core';
import type { ConfigT as MetroConfigT } from 'metro-config/src/configTypes.flow';

export type Args = {|
  +assetExts: $ReadOnlyArray < string >,
  +cert: string,
    +customLogReporterPath ?: string,
    +host: string,
      +https: boolean,
        +maxWorkers: number,
          +key: string,
            +nonPersistent: boolean,
              +platforms: $ReadOnlyArray < string >,
                +port: number,
                  +projectRoot: string,
                    +providesModuleNodeModules: Array < string >,
                      +resetCache: boolean,
                        +sourceExts: $ReadOnlyArray < string >,
                          +transformer ?: string,
                          +verbose: boolean,
                            +watchFolders: $ReadOnlyArray < string >,
|};

async function runServer(args: Args, config: ConfigT) {
  const terminal = new Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath || null);
  const reporter = new ReporterImpl(terminal);
  const middlewareManager = new MiddlewareManager(args);

  middlewareManager.getConnectInstance().use(morgan('combined'));

  args.watchFolders.forEach(middlewareManager.serveStatic.bind(middlewareManager));

  // @todo(mike) replace this with real config
  const metroConfig = {};

  // $FlowFixMe Metro configuration is immutable.
  metroConfig.maxWorkers = args.maxWorkers;
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.server.port = args.port;
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.reporter = reporter;
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.resetCache = args.resetCache;
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.projectRoot = args.projectRoot;
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.watchFolders = args.watchFolders.slice(0);
  // $FlowFixMe Metro configuration is immutable.
  metroConfig.server.enhanceMiddleware = middleware =>
    middlewareManager.getConnectInstance().use(middleware);

  if (args.sourceExts !== config.resolver.sourceExts) {
    // $FlowFixMe Metro configuration is immutable.
    metroConfig.resolver.sourceExts = args.sourceExts.concat(
      metroConfig.resolver.sourceExts,
    );
  }

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
