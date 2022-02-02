/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import glob from 'glob';
import path from 'path';

// Regexp matching all test projects
const TEST_PROJECTS = /test|example|sample/i;

// Base iOS folder
const IOS_BASE = 'ios';

// These folders will be excluded from search to speed it up
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules|Carthage)/**'];

export default function findPodfilePath(cwd: string) {
  /**
   * First, we're going to look for all Podfiles within the `cwd`
   */
  const podfiles = glob
    .sync('**/Podfile', {
      cwd,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    /**
     * Then, we will run a simple test to rule out most example projects,
     * unless they are located in a `ios` folder
     */
    .filter(
      (project) =>
        path.dirname(project) === IOS_BASE || !TEST_PROJECTS.test(project),
    )
    /**
     * Podfile from `ios` folder will be picked up as a first one.
     */
    .sort((project) => (path.dirname(project) === IOS_BASE ? -1 : 1));

  if (podfiles.length > 0) {
    /**
     * @todo
     * Shall we print a warning when multiple `Podfile` were found?
     */
    return path.join(cwd, podfiles[0]);
  }

  return null;
}
