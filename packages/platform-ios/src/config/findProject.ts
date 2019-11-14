/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import glob from 'glob';
import path from 'path';

/**
 * Glob pattern to look for xcodeproj
 */
const GLOB_PATTERN = '**/*.xcodeproj';

/**
 * Regexp matching all test projects
 */
const TEST_PROJECTS = /test|example|sample/i;

/**
 * Base iOS folder
 */
const IOS_BASE = 'ios';

/**
 * These folders will be excluded from search to speed it up
 */
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules|Carthage)/**'];

/**
 * Finds iOS project by looking for all .xcodeproj files
 * in given folder.
 *
 * Returns first match if files are found or null
 *
 * Note: `./ios/*.xcodeproj` are returned regardless of the name
 */
export default function findProject(folder: string): string | null {
  const projects = glob
    .sync(GLOB_PATTERN, {
      cwd: folder,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    .filter(
      project =>
        path.dirname(project) === IOS_BASE || !TEST_PROJECTS.test(project),
    )
    .sort(project => (path.dirname(project) === IOS_BASE ? -1 : 1));

  if (projects.length === 0) {
    return null;
  }

  return projects[0];
}
