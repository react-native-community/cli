/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import open from 'open';
import {execSync} from 'child_process';
import {logger} from '@react-native-community/cli-tools';
import launchDefaultBrowser from './launchDefaultBrowser';
import chalk from 'chalk';

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

function commandExistsWindowsSync(commandName) {
  try {
    const stdout = execSync('where ' + commandName, {stdio: []});
    return !!stdout;
  } catch (error) {
    return false;
  }
}

function commandExists(commandName) {
  switch (process.platform) {
    case 'win32':
      return commandExistsWindowsSync(commandName);
    case 'linux':
    case 'darwin':
      return commandExistsUnixSync(commandName);
    default:
      // assume it doesn't exist, just to be safe.
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
  open(url, {app: [getChromeAppName()]}, err => {
    if (err) {
      logger.error('Google Chrome exited with error:', err);
    }
  });
}

function launchDebugger(url: string) {
  if (!commandExists(getChromeAppName())) {
    logger.info(
      `For a better debugging experience please install Google Chrome from: ${chalk.underline.dim(
        'https://www.google.com/chrome/',
      )}`,
    );
    launchDefaultBrowser(url);
    return;
  }
  launchChrome(url);
}

export default launchDebugger;
