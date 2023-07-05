/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import open from 'open';
import throwIfNonAllowedProtocol from './throwIfNonAllowedProtocol';
import logger from './logger';

async function launchDefaultBrowser(url: string) {
  try {
    throwIfNonAllowedProtocol(url);

    await open(url);
  } catch (err) {
    if (err instanceof Error) {
      logger.error('Browser exited with error:', err.message);
    }
  }
}

export default launchDefaultBrowser;
