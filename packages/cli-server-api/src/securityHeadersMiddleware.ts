/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';

export default function securityHeadersMiddleware(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: (err?: any) => void,
) {
  // Block any cross origin request.
  if (
    typeof req.headers.origin === 'string' &&
    !req.headers.origin.match(/^https?:\/\/localhost:/)
  ) {
    next(
      new Error(
        'Unauthorized request from ' +
          req.headers.origin +
          '. This may happen because of a conflicting browser extension. Please try to disable it and try again.',
      ),
    );
    return;
  }

  // Block MIME-type sniffing.
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
}
