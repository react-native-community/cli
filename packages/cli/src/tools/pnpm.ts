/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import findUp from 'find-up';

export function getPnpmVersionIfAvailable() {
  let pnpmVersion;
  try {
    // execSync returns a Buffer -> convert to string
    pnpmVersion = (
      execSync('pnpm --version', {
        stdio: [0, 'pipe', 'ignore'],
      }).toString() || ''
    ).trim();

    return pnpmVersion;
  } catch (error) {
    return null;
  }
}

export function isProjectUsingPnpm(cwd: string) {
  return findUp.sync('pnpm-lock.yaml', {cwd});
}
