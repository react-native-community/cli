/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import glob from 'tinyglobby';
import {unixifyPaths} from '@react-native-community/cli-tools';

// These folders will be excluded from search to speed it up
const GLOB_EXCLUDE_PATTERN = [
  '**/@(Pods|node_modules|Carthage|vendor|android)/**',
];

export default function findAllPodfilePaths(cwd: string) {
  return glob.globSync('**/Podfile', {
    cwd: unixifyPaths(cwd),
    expandDirectories: false,
    ignore: GLOB_EXCLUDE_PATTERN,
    // Stop unbounded globbing and infinite loops for projects
    // with deeply nested subdirectories. The most likely result
    // is `ios/Podfile`, so this depth should be plenty:
    deep: 10,
  });
}
