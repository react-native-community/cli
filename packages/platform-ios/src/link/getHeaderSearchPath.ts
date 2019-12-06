/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {posix as path} from 'path';
import {last, union} from 'lodash';

/**
 * Given an array of directories, it returns the one that contains
 * all the other directories in a given array inside it.
 *
 * Example:
 * Given an array of directories: ['/Users/Kureev/a', '/Users/Kureev/b']
 * the returned folder is `/Users/Kureev`
 *
 * Check `getHeaderSearchPath.spec.js` for more use-cases.
 */
const getOuterDirectory = (directories: Array<string>) =>
  directories.reduce((topDir, currentDir) => {
    const currentFolders = currentDir.split(path.sep);
    const topMostFolders = topDir.split(path.sep);

    if (
      currentFolders.length === topMostFolders.length &&
      last(currentFolders) !== last(topMostFolders)
    ) {
      return currentFolders.slice(0, -1).join(path.sep);
    }

    return currentFolders.length < topMostFolders.length ? currentDir : topDir;
  });

/**
 * Given an array of headers it returns search path so Xcode can resolve
 * headers when referenced like below:
 * ```
 * #import "CodePush.h"
 * ```
 * If all files are located in one directory (directories.length === 1),
 * we simply return a relative path to that location.
 *
 * Otherwise, we loop through them all to find the outer one that contains
 * all the headers inside. That location is then returned with /** appended at
 * the end so Xcode marks that location as `recursive` and will look inside
 * every folder of it to locate correct headers.
 */
export default function getHeaderSearchPath(
  sourceDir: string,
  headers: Array<string>,
) {
  const directories = union(headers.map(path.dirname));

  return directories.length === 1
    ? `"$(SRCROOT)/${path.relative(sourceDir, directories[0])}"`
    : `"$(SRCROOT)/${path.relative(
        sourceDir,
        getOuterDirectory(directories),
      )}/**"`;
}
