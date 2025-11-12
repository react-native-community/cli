/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {IncomingMessage, ServerResponse} from 'http';

import {json} from 'body-parser';
import connect from 'connect';
import open from 'open';

/**
 * Open a URL in the system browser.
 */
export async function openURLMiddleware(
  req: IncomingMessage & {
    // Populated by body-parser
    body?: Object;
  },
  res: ServerResponse,
  next: (err?: Error) => void,
) {
  if (req.method === 'POST') {
    if (req.body == null) {
      res.writeHead(400);
      res.end('Missing request body');
      return;
    }

    const {url} = req.body as {url: string};

    if (typeof url !== 'string') {
      res.writeHead(400);
      res.end('URL must be a string');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      res.writeHead(400);
      res.end('Invalid URL format');
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      res.writeHead(400);
      res.end('Invalid URL protocol');
      return;
    }

    // Reconstruct URL with proper encoding to prevent command injection
    // The URL constructor doesn't automatically encode special characters like | in query strings,
    // which can be interpreted as shell commands.
    // So we create a new URL object with sanitized components to prevent command injection.
    const sanitizedUrl = new URL(parsedUrl.origin);
    sanitizedUrl.pathname = encodeURI(parsedUrl.pathname);
    sanitizedUrl.search = new URLSearchParams(parsedUrl.search).toString();
    sanitizedUrl.hash = encodeURI(parsedUrl.hash);

    await open(sanitizedUrl.href);

    res.writeHead(200);
    res.end();
  }

  next();
}

export default connect().use(json()).use(openURLMiddleware);
