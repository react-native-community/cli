/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';
import copyAndReplace from './copyAndReplace';
import walk from './walk';

/**
 * Copy files (binary included) recursively.
 */
function copyFiles(srcPath: string, destPath: string) {
  walk(srcPath).forEach(absoluteSrcFilePath => {
    const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
    copyAndReplace(
      absoluteSrcFilePath,
      path.resolve(destPath, relativeFilePath),
      {}, // no replacements
    );
  });
}

export default copyFiles;
