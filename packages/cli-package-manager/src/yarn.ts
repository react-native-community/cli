/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import semver from 'semver';
import {logger} from '@react-native-community/cli-tools';
import findUp from 'find-up';

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
 * Check if project is using Yarn (has `yarn.lock` in the tree)
 */
export function isProjectUsingYarn(cwd: string) {
  return findUp.sync('yarn.lock', {cwd});
}
