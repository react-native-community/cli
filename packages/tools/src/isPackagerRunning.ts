/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fetch} from './fetch';

/**
 * Indicates whether or not the packager is running. It returns a promise that
 * returns one of these possible values:
 *   - `running`: the packager is running
 *   - `not_running`: the packager nor any process is running on the expected port.
 *   - `unrecognized`: one other process is running on the port we expect the packager to be running.
 */
async function isPackagerRunning(
  packagerPort: string | number = process.env.RCT_METRO_PORT || '8081',
): Promise<'running' | 'not_running' | 'unrecognized'> {
  try {
    const {data} = await fetch(`http://localhost:${packagerPort}/status`);

    return data === 'packager-status:running' ? 'running' : 'unrecognized';
  } catch (_error) {
    return 'not_running';
  }
}

export default isPackagerRunning;
