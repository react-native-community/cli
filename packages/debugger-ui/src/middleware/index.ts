import serveStatic from 'serve-static';
import path from 'path';

export function debuggerUIMiddleware() {
  return serveStatic(path.join(__dirname, '..', 'ui'));
}
