/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import opn from 'opn';
import {execSync} from 'child_process';
import {logger} from '@react-native-community/cli-tools';

function commandExistsUnixSync(commandName) {
  try {
    const stdout = execSync(
      `command -v ${commandName} 2>/dev/null` +
        ` && { echo >&1 '${commandName} found'; exit 0; }`,
    );
    return !!stdout;
  } catch (error) {
    return false;
  }
}

function getChromeAppName(): string {
  switch (process.platform) {
    case 'darwin':
      return 'google chrome';
    case 'win32':
      return 'chrome';
    case 'linux':
      if (commandExistsUnixSync('google-chrome')) {
        return 'google-chrome';
      }
      if (commandExistsUnixSync('chromium-browser')) {
        return 'chromium-browser';
      }
      return 'chromium';

    default:
      return 'google-chrome';
  }
}

function launchChrome(url: string) {
  opn(url, {app: [getChromeAppName()]}, err => {
    if (err) {
      logger.error('Google Chrome exited with error:', err);
    }
  });
}

export default launchChrome;
