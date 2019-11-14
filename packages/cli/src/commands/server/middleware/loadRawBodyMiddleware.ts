/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';

export default function rawBodyMiddleware(
  req: http.IncomingMessage,
  _res: http.ServerResponse,
  next: (err?: any) => void,
) {
  (req as http.IncomingMessage & {rawBody: string}).rawBody = '';
  req.setEncoding('utf8');

  req.on('data', (chunk: string) => {
    (req as http.IncomingMessage & {rawBody: string}).rawBody += chunk;
  });

  req.on('end', () => {
    next();
  });
}
