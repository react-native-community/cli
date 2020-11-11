import http, {Server as HttpServer} from 'http';
import {Server as HttpsServer} from 'https';

import compression from 'compression';
import connect from 'connect';
import errorhandler from 'errorhandler';
import nocache from 'nocache';
import serveStatic from 'serve-static';
import {debuggerUIMiddleware} from '@react-native-community/cli-debugger-ui';

import devToolsMiddleware from './devToolsMiddleware';
import indexPageMiddleware from './indexPageMiddleware';
import openStackFrameInEditorMiddleware from './openStackFrameInEditorMiddleware';
import openURLMiddleware from './openURLMiddleware';
import rawBodyMiddleware from './rawBodyMiddleware';
import securityHeadersMiddleware from './securityHeadersMiddleware';
import statusPageMiddleware from './statusPageMiddleware';
import systraceProfileMiddleware from './systraceProfileMiddleware';

import debuggerProxyServer from './websocket/debuggerProxyServer';
import eventsSocketServer from './websocket/eventsSocketServer';
import messageSocketServer from './websocket/messageSocketServer';

export {devToolsMiddleware};
export {indexPageMiddleware};
export {openStackFrameInEditorMiddleware};
export {openURLMiddleware};
export {rawBodyMiddleware};
export {securityHeadersMiddleware};
export {statusPageMiddleware};
export {systraceProfileMiddleware};

export {debuggerProxyServer};
export {eventsSocketServer};
export {messageSocketServer};

type MiddlewareOptions = {
  host?: string;
  watchFolders: ReadonlyArray<string>;
  port: number;
};

export function createDevServerMiddleware(options: MiddlewareOptions) {
  let isDebuggerConnected = () => false;
  let broadcast = (_event: any) => {};

  const middleware = connect()
    .use(securityHeadersMiddleware)
    // @ts-ignore compression and connect types mismatch
    .use(compression())
    .use(nocache())
    .use('/debugger-ui', debuggerUIMiddleware())
    .use(
      '/launch-js-devtools',
      devToolsMiddleware(options, () => isDebuggerConnected()),
    )
    .use('/open-stack-frame', openStackFrameInEditorMiddleware(options))
    .use('/open-url', openURLMiddleware)
    .use('/status', statusPageMiddleware)
    .use('/symbolicate', rawBodyMiddleware)
    .use('/systrace', systraceProfileMiddleware)
    .use('/reload', (_req: http.IncomingMessage, res: http.ServerResponse) => {
      broadcast('reload');
      res.end('OK');
    })
    .use(errorhandler());

  options.watchFolders.forEach((folder) => {
    // @ts-ignore mismatch between express and connect middleware types
    middleware.use(serveStatic(folder));
  });

  return {
    attachToServer(server: HttpServer | HttpsServer) {
      const debuggerProxy = debuggerProxyServer.attachToServer(
        server,
        '/debugger-proxy',
      );
      const messageSocket = messageSocketServer.attachToServer(
        server,
        '/message',
      );
      broadcast = messageSocket.broadcast;
      isDebuggerConnected = debuggerProxy.isDebuggerConnected;
      const eventsSocket = eventsSocketServer.attachToServer(
        server,
        '/events',
        messageSocket,
      );
      return {
        debuggerProxy,
        eventsSocket,
        messageSocket,
      };
    },
    middleware,
  };
}
