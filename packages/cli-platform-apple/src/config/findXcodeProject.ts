/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import {IOSProjectInfo} from '@react-native-community/cli-types';

function findXcodeProject(files: Array<string>): IOSProjectInfo | null {
  const sortedFiles = files.sort();

  for (let i = sortedFiles.length - 1; i >= 0; i--) {
    const fileName = files[i];
    const ext = path.extname(fileName);
    const projectPath = path.dirname(fileName);

    if (ext === '.xcworkspace') {
      return {
        name: fileName,
        path: projectPath,
        isWorkspace: true,
      };
    }
    if (ext === '.xcodeproj') {
      return {
        name: fileName,
        path: projectPath,
        isWorkspace: false,
      };
    }
  }

  return null;
}

export default findXcodeProject;
