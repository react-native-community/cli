/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import xcode from 'xcode';
import getGroup from './getGroup';
import hasLibraryImported from './hasLibraryImported';

/**
 * Returns true if `xcodeproj` specified by dependencyConfig is present
 * in a top level `libraryFolder`
 */
export default function isInstalled(projectConfig, dependencyConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const libraries = getGroup(project, projectConfig.libraryFolder);

  if (!libraries) {
    return false;
  }

  return hasLibraryImported(libraries, dependencyConfig.projectName);
}
