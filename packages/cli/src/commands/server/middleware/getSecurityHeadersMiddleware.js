/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @strict
 * @format
 */

export default function getSecurityHeadersMiddleware(req, res, next) {
  const address = req.client.server.address();

  // Block any cross origin request.
  if (
    req.headers.origin &&
    req.headers.origin !== `http://localhost:${address.port}`
  ) {
    next(new Error('Unauthorized request from ' + req.headers.origin + '. If you have no idea what this is, it may come from some browser extensions. Stop them and try again.'));
    return;
  }

  // Block MIME-type sniffing.
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
}
