/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @strict
 * @flow
 */

import compression from 'compression';
import connect from 'connect';
import errorhandler from 'errorhandler';
import path from 'path';
import serveStatic from 'serve-static';
import {Server as WebSocketServer} from 'ws';

import indexPageMiddleware from './indexPage';
import copyToClipBoardMiddleware from './copyToClipBoardMiddleware';
import getSecurityHeadersMiddleware from './getSecurityHeadersMiddleware';
import loadRawBodyMiddleware from './loadRawBodyMiddleware';
import openStackFrameInEditorMiddleware from './openStackFrameInEditorMiddleware';
import openURLMiddleware from './openURLMiddleware';
import statusPageMiddleware from './statusPageMiddleware';
import systraceProfileMiddleware from './systraceProfileMiddleware';
import getDevToolsMiddleware from './getDevToolsMiddleware';

type Options = {
  +watchFolders: $ReadOnlyArray<string>,
  +host?: string,
};

type WebSocketProxy = {
  server: WebSocketServer,
  isDebuggerConnected: () => boolean,
};

type Connect = $Call<connect>;

export default class MiddlewareManager {
  app: Connect;

  options: Options;

  constructor(options: Options) {
    const debuggerUIFolder = path.join(__dirname, '..', 'debugger-ui');

    this.options = options;
    this.app = connect()
      .use(getSecurityHeadersMiddleware)
      .use(loadRawBodyMiddleware)
      .use(compression())
      .use('/debugger-ui', serveStatic(debuggerUIFolder))
      .use(openStackFrameInEditorMiddleware(this.options))
      .use(openURLMiddleware)
      .use(copyToClipBoardMiddleware)
      .use(statusPageMiddleware)
      .use(systraceProfileMiddleware)
      .use(indexPageMiddleware)
      .use(errorhandler());
  }

  serveStatic(folder: string) {
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
