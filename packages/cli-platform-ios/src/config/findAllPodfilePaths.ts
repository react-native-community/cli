/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import glob from 'glob';

// These folders will be excluded from search to speed it up
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules|Carthage)/**'];

export default function findAllPodfilePaths(cwd: string) {
  return glob.sync('**/Podfile', {
    cwd,
    ignore: GLOB_EXCLUDE_PATTERN,
  });
}
