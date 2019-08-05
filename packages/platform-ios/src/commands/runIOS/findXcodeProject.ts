/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';

export type ProjectInfo = {
  name: string;
  isWorkspace: boolean;
};

function findXcodeProject(files: Array<string>): ProjectInfo | null {
  const sortedFiles = files.sort();
  for (let i = sortedFiles.length - 1; i >= 0; i--) {
    const fileName = files[i];
    const ext = path.extname(fileName);

    if (ext === '.xcworkspace') {
      return {
        name: fileName,
        isWorkspace: true,
      };
    }
    if (ext === '.xcodeproj') {
      return {
        name: fileName,
        isWorkspace: false,
      };
    }
  }

  return null;
}

export default findXcodeProject;
