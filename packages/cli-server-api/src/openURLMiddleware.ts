/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import {launchDefaultBrowser, logger} from '@react-native-community/cli-tools';
import connect from 'connect';
import rawBodyMiddleware from './rawBodyMiddleware';

/**
 * Handle request from JS to open an arbitrary URL in Chrome
 */
function openURLMiddleware(
  req: http.IncomingMessage & {rawBody?: string},
  res: http.ServerResponse,
  next: (err?: any) => void,
) {
  if (!req.rawBody) {
    return next(new Error('missing request body'));
  }
  const {url} = JSON.parse(req.rawBody);
  logger.info(`Opening ${url}...`);
  launchDefaultBrowser(url);
  res.end('OK');
}

export default connect().use(rawBodyMiddleware).use(openURLMiddleware);
