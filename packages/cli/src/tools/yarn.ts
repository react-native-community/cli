/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import {logger} from '@react-native-community/cli-tools';

/**
 * Use Yarn if available, it's much faster than the npm client.
 * Return the version of yarn installed on the system, null if yarn is not available.
 */
export function getYarnVersionIfAvailable() {
  let yarnVersion;
  try {
    // execSync returns a Buffer -> convert to string
    yarnVersion = (
      execSync('yarn --version', {
        stdio: [0, 'pipe', 'ignore'],
      }).toString() || ''
    ).trim();
  } catch (error) {
    return null;
  }
  // yarn < 0.16 has a 'missing manifest' bug
  try {
    if (semver.gte(yarnVersion, '0.16.0')) {
      return yarnVersion;
    }
    return null;
  } catch (error) {
    logger.error(`Cannot parse yarn version: ${yarnVersion}`);
    return null;
  }
}

/**
 * Check that 'react-native init' itself used yarn to install React Native.
 * When using an old global react-native-cli@1.0.0 (or older), we don't want
 * to install React Native with npm, and React + Jest with yarn.
 * Let's be safe and not mix yarn and npm in a single project.
 * @param projectDir e.g. /Users/martin/AwesomeApp
 */
export function isProjectUsingYarn(projectDir: string) {
  return fs.existsSync(path.join(projectDir, 'yarn.lock'));
}
