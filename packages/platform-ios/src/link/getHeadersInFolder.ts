/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import glob from 'glob';
import path from 'path';

const GLOB_EXCLUDE_PATTERN = [
  'node_modules/**',
  'Pods/**',
  'Examples/**',
  'examples/**',
];

/**
 * Given folder, it returns an array of all header files
 * inside it, ignoring node_modules and examples
 */
export default function getHeadersInFolder(folder: string) {
  return glob
    .sync('**/*.h', {
      cwd: folder,
      nodir: true,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    .map((file) => path.join(folder, file));
}
