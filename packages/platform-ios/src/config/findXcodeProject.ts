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

  const [workspaces, projects] = files.reduce<[string[], string[]]>(
    ([w, p], fileName) => {
      const ext = path.extname(fileName);
      if (ext === '.xcworkspace') {
        return [[...w, fileName], p];
      }
      if (ext === '.xcodeproj') {
        return [w, [...p, fileName]];
      }
      return [w, p];
    },
    [[], []],
  );

  if (workspaces.length > 0) {
    if (workspaces.length > 1) {

    }
    return {
      workspaces[0],
      isWorkspace: true,
    };
  }

  if (projects.length > 0) {
    if (projects.length > 1) {

    }
    return {
      name: projects[0],
      isWorkspace: false,
    }
  }

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
