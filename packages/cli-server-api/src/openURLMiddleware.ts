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
async function openURLMiddleware(
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

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        res.writeHead(400);
        res.end('Invalid URL protocol');
        return;
      }
    } catch (error) {
      res.writeHead(400);
      res.end('Invalid URL format');
      return;
    }

    await open(url);

    res.writeHead(200);
    res.end();
  }

  next();
}

export default connect().use(json()).use(openURLMiddleware);
