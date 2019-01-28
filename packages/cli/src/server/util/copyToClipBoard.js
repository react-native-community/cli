/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import childProcess from 'child_process';
import path from 'path';
import fs from 'fs';

const xsel = path.join(__dirname, 'external/xsel');
fs.chmodSync(xsel, '0755');

/**
 * Copy the content to host system clipboard.
 */
function copyToClipBoard(content) {
  switch (process.platform) {
    case 'darwin': {
      const child = childProcess.spawn('pbcopy', []);
      child.stdin.end(Buffer.from(content, 'utf8'));
      return true;
    }
    case 'win32': {
      const child = childProcess.spawn('clip', []);
      child.stdin.end(Buffer.from(content, 'utf8'));
      return true;
    }
    case 'linux': {
      const child = childProcess.spawn(xsel, ['--clipboard', '--input']);
      child.stdin.end(Buffer.from(content, 'utf8'));
      return true;
    }
    default:
      return false;
  }
}

export default copyToClipBoard;
