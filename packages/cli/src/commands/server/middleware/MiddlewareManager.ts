/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import compression from 'compression';
import connect from 'connect';
import errorhandler from 'errorhandler';
import {Server as WebSocketServer} from 'ws';
import serveStatic from 'serve-static';
import {debuggerUIMiddleware} from '@react-native-community/cli-debugger-ui';
import indexPageMiddleware from './indexPage';
import getSecurityHeadersMiddleware from './getSecurityHeadersMiddleware';
import loadRawBodyMiddleware from './loadRawBodyMiddleware';
import openStackFrameInEditorMiddleware from './openStackFrameInEditorMiddleware';
import openURLMiddleware from './openURLMiddleware';
import statusPageMiddleware from './statusPageMiddleware';
import systraceProfileMiddleware from './systraceProfileMiddleware';
import getDevToolsMiddleware from './getDevToolsMiddleware';

type Options = {
  host?: string;
  watchFolders: Array<string>;
  port: number;
};

type WebSocketProxy = {
  server?: WebSocketServer;
  isDebuggerConnected: () => boolean;
};

export default class MiddlewareManager {
  app: connect.Server;

  options: Options;

  constructor(options: Options) {
    this.options = options;
    this.app = connect()
      .use(getSecurityHeadersMiddleware)
      .use(loadRawBodyMiddleware)
      // @ts-ignore compression and connect types mismatch
      .use(compression())
      .use('/debugger-ui', debuggerUIMiddleware())
      .use(openStackFrameInEditorMiddleware(this.options))
      .use(openURLMiddleware)
      .use(statusPageMiddleware)
      .use(systraceProfileMiddleware)
      .use(indexPageMiddleware)
      .use(errorhandler());
  }

  serveStatic(folder: string) {
    // @ts-ignore serveStatic and connect types mismatch
    this.app.use(serveStatic(folder));
  }

  getConnectInstance() {
    return this.app;
  }

  attachDevToolsSocket(socket: WebSocketProxy) {
    this.app.use(
      getDevToolsMiddleware(this.options, () => socket.isDebuggerConnected()),
    );
  }
}
