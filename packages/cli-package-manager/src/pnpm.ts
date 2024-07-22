/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import findUp from 'find-up';

/**
 * Use pnpm if available, it's fast and efficient.
 * Return the version of pnpm installed on the system, null if pnpm is not available.
 */
export function getPnpmVersionIfAvailable() {
  let pnpmVersion;
  try {
    // execSync returns a Buffer -> convert to string
    pnpmVersion = (
      execSync('pnpm --version', {
        stdio: [0, 'pipe', 'ignore'],
      }).toString() || ''
    ).trim();
  } catch (error) {
    return null;
  }
  // Check for a minimum version if needed
  // try {
  //   if (semver.gte(pnpmVersion, '3.0.0')) {
  //     // Adjust this version as needed
  return pnpmVersion;
  //   }
  //   return null;
  // } catch (error) {
  //   logger.error(`Cannot parse pnpm version: ${pnpmVersion}`);
  //   return null;
  // }
}

/**
 * Check if project is using pnpm (has `pnpm-lock.yaml` in the tree)
 */
export function isProjectUsingPnpm(cwd: string) {
  return findUp.sync('pnpm-lock.yaml', {cwd});
}
