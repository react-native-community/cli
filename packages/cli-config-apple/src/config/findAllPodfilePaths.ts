/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import glob from 'fast-glob';
import {unixifyPaths} from '@react-native-community/cli-tools';

// These folders will be excluded from search to speed it up
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules|Carthage|vendor)/**'];

export default function findAllPodfilePaths(cwd: string) {
  return glob.sync('**/Podfile', {
    cwd: unixifyPaths(cwd),
    ignore: GLOB_EXCLUDE_PATTERN,
    // Stop unbounded globbing and infinite loops for projects
    // with deeply nested subdirectories. The most likely result
    // is `ios/Podfile`, so this depth should be plenty:
    deep: 10,
  });
}
