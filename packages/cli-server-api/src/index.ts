import http from 'http';

import compression from 'compression';
import connect from 'connect';
import errorhandler from 'errorhandler';
import nocache from 'nocache';
import serveStatic from 'serve-static';

import indexPageMiddleware from './indexPageMiddleware';
import openStackFrameInEditorMiddleware from './openStackFrameInEditorMiddleware';
import openURLMiddleware from './openURLMiddleware';
import rawBodyMiddleware from './rawBodyMiddleware';
import securityHeadersMiddleware from './securityHeadersMiddleware';
import statusPageMiddleware from './statusPageMiddleware';
import systraceProfileMiddleware from './systraceProfileMiddleware';

import createMessageSocketEndpoint from './websocket/createMessageSocketEndpoint';
import createEventsSocketEndpoint from './websocket/createEventsSocketEndpoint';

type MiddlewareOptions = {
  host?: string;
  watchFolders: ReadonlyArray<string>;
  port: number;
};

export function createDevServerMiddleware(options: MiddlewareOptions) {
  const messageSocketEndpoint = createMessageSocketEndpoint();
  const broadcast = messageSocketEndpoint.broadcast;

  const eventsSocketEndpoint = createEventsSocketEndpoint(broadcast);

  const middleware = connect()
    .use(securityHeadersMiddleware(options))
    // @ts-ignore compression and connect types mismatch
    .use(compression())
    .use(nocache())
    .use('/', indexPageMiddleware)
    .use('/open-stack-frame', openStackFrameInEditorMiddleware(options))
    .use('/open-url', openURLMiddleware)
    .use('/status', statusPageMiddleware)
    .use('/symbolicate', rawBodyMiddleware)
    // @ts-ignore mismatch
    .use('/systrace', systraceProfileMiddleware)
    .use('/reload', (_req: http.IncomingMessage, res: http.ServerResponse) => {
      broadcast('reload');
      res.end('OK');
    })
    // @ts-ignore mismatch
    .use(errorhandler());

  options.watchFolders.forEach((folder) => {
    // @ts-ignore mismatch between express and connect middleware types
    middleware.use(serveStatic(folder));
  });

  return {
    websocketEndpoints: {
      '/message': messageSocketEndpoint.server,
      '/events': eventsSocketEndpoint.server,
    },
    messageSocketEndpoint,
    eventsSocketEndpoint,
    middleware,
  };
}
