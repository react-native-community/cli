/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import xcode from 'xcode';
import getGroup from './getGroup';
import hasLibraryImported from './hasLibraryImported';
import {
  IOSProjectConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';

const memo = new Map();

/**
 * Returns true if `xcodeproj` specified by dependencyConfig is present
 * in a top level `libraryFolder`
 */
export default function isInstalled(
  projectConfig: IOSProjectConfig,
  dependencyConfig: IOSDependencyConfig,
) {
  let project;

  if (memo.has(projectConfig.pbxprojPath)) {
    project = memo.get(projectConfig.pbxprojPath);
  } else {
    project = xcode.project(projectConfig.pbxprojPath).parseSync();
    memo.set(projectConfig.pbxprojPath, project);
  }

  const libraries = getGroup(project, projectConfig.libraryFolder);

  if (!libraries) {
    return false;
  }

  return hasLibraryImported(libraries, dependencyConfig.projectName);
}
