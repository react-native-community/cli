/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {unixifyPaths} from '@react-native-community/cli-tools';
import fg from 'fast-glob';

// These folders will be excluded from search to speed it up
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules|Carthage|vendor)/**'];

export default function findAllPodfilePaths(cwd: string) {
  return fg.sync('**/Podfile', {
    cwd: unixifyPaths(cwd),
    ignore: GLOB_EXCLUDE_PATTERN,
  });
}
