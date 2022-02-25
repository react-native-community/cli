import http from 'http';

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

import createDebuggerProxyEndpoint from './websocket/createDebuggerProxyEndpoint';
import createMessageSocketEndpoint from './websocket/createMessageSocketEndpoint';
import createEventsSocketEndpoint from './websocket/createEventsSocketEndpoint';

export {devToolsMiddleware};
export {indexPageMiddleware};
export {openStackFrameInEditorMiddleware};
export {openURLMiddleware};
export {rawBodyMiddleware};
export {securityHeadersMiddleware};
export {statusPageMiddleware};
export {systraceProfileMiddleware};

type MiddlewareOptions = {
  host?: string;
  watchFolders: ReadonlyArray<string>;
  port: number;
};

export function createDevServerMiddleware(options: MiddlewareOptions) {
  const debuggerProxyEndpoint = createDebuggerProxyEndpoint();
  const isDebuggerConnected = debuggerProxyEndpoint.isDebuggerConnected;

  const messageSocketEndpoint = createMessageSocketEndpoint();
  const broadcast = messageSocketEndpoint.broadcast;

  const eventsSocketEndpoint = createEventsSocketEndpoint(broadcast);

  const middleware = connect()
    .use(securityHeadersMiddleware)
    // @ts-ignore compression and connect types mismatch
    .use(compression())
    .use(nocache())
    .use('/debugger-ui', debuggerUIMiddleware())
    .use(
      '/launch-js-devtools',
      devToolsMiddleware(options, isDebuggerConnected),
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
    websocketEndpoints: {
      '/debugger-proxy': debuggerProxyEndpoint.server,
      '/message': messageSocketEndpoint.server,
      '/events': eventsSocketEndpoint.server,
    },
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    middleware,
  };
}
