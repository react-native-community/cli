/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import glob from 'glob';
import path from 'path';

export default function findPodfilePath(folder: string) {
  const podfiles = glob.sync('**/Podfile', {
    cwd: folder,
    ignore: 'node_modules/**',
  });
  if (podfiles.length > 0) {
    return path.join(folder, podfiles[0]);
  }

  return null;
}
