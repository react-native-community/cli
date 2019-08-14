/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import launchDefaultBrowser from '../launchDefaultBrowser';
import {logger} from '@react-native-community/cli-tools';

/**
 * Handle request from JS to open an arbitrary URL in Chrome
 */
export default function openURLMiddleware(req, res, next) {
  if (req.url === '/open-url') {
    const {url} = JSON.parse(req.rawBody);
    logger.info(`Opening ${url}...`);
    launchDefaultBrowser(url);
    res.end('OK');
  } else {
    next();
  }
}
