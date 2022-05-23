/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import open from 'open';
import isValidBrowserUrl from './isValidUrl';
import logger from './logger';

async function launchDefaultBrowser(url: string) {
  try {
    const isSafeToOpenUrlInBrowser = isValidBrowserUrl(url);
    if (!isSafeToOpenUrlInBrowser) throw new Error("invalid url, missing http/https protocol");

    await open(url);
  } catch (err) {
    if (err) {
      logger.error('Browser exited with error:', err);
    }
  }
}

export default launchDefaultBrowser;
