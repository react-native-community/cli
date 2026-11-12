import connect from 'connect';
import errorhandler from 'errorhandler';
import serveStatic from 'serve-static';

import indexPageMiddleware from './indexPageMiddleware';
import systraceProfileMiddleware from './systraceProfileMiddleware';

type MiddlewareOptions = {
  host?: string;
  watchFolders: ReadonlyArray<string>;
  port: number;
};

export function createDevServerMiddleware(options: MiddlewareOptions) {
  const middleware = connect()
    .use('/', indexPageMiddleware)
    // @ts-ignore mismatch
    .use('/systrace', systraceProfileMiddleware)
    // @ts-ignore mismatch
    .use(errorhandler());

  options.watchFolders.forEach((folder) => {
    // @ts-ignore mismatch between express and connect middleware types
    middleware.use(serveStatic(folder));
  });

  return {middleware};
}
