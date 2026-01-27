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

    let sanitizedUrl: string;
    try {
      const {sanitizeUrl} = await import('strict-url-sanitise');
      sanitizedUrl = sanitizeUrl(url);
    } catch (error) {
      res.writeHead(400);
      res.end(error instanceof Error ? error.message : 'Invalid URL');
      return;
    }

    await open(sanitizedUrl);

    res.writeHead(200);
    res.end();
  }

  next();
}

export default connect().use(json()).use(openURLMiddleware);
