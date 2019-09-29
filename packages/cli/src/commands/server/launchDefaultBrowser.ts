/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import open from 'open';
import {logger} from '@react-native-community/cli-tools';

function launchDefaultBrowser(url: string) {
  // @ts-ignore open's second argument takes an option, not callback
  open(url, (err: string) => {
    if (err) {
      logger.error('Browser exited with error:', err);
    }
  });
}

export default launchDefaultBrowser;
