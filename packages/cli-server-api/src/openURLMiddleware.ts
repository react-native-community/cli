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

// open@6 launches URLs through `cmd /c start` on Windows and only escapes `&`.
// Reject the remaining cmd metacharacters, including `%` and `!` expansion,
// even though this also rejects some otherwise-valid percent-encoded URLs.
const WINDOWS_SHELL_SPECIAL_CHARS = /[|<>^%!]/;
const INVALID_URL = 'Invalid URL';

function sendResponse(
  res: ServerResponse,
  statusCode: number,
  message?: string,
) {
  res.writeHead(statusCode);
  res.end(message);
}

function isSafeHostname(hostname: string) {
  return (
    (hostname.startsWith('[') && hostname.endsWith(']')) ||
    hostname === encodeURIComponent(hostname)
  );
}

function validateURLForOpen(url: string) {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Invalid URL protocol');
  }

  if (!isSafeHostname(parsedUrl.hostname)) {
    throw new Error('Invalid URL hostname');
  }

  if (WINDOWS_SHELL_SPECIAL_CHARS.test(parsedUrl.href)) {
    throw new Error('Invalid URL characters');
  }

  return parsedUrl.href;
}

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
      sendResponse(res, 400, 'Missing request body');
      return;
    }

    const {url} = req.body as {url: string};

    if (typeof url !== 'string') {
      sendResponse(res, 400, 'URL must be a string');
      return;
    }

    let validatedUrl;
    try {
      validatedUrl = validateURLForOpen(url);
    } catch {
      sendResponse(res, 400, INVALID_URL);
      return;
    }

    await open(validatedUrl);

    sendResponse(res, 200);
    return;
  }

  next();
}

export default connect().use(json()).use(openURLMiddleware);
