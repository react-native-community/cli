/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import xcode from 'xcode';
import fs from 'fs';
import path from 'path';
import { isEmpty } from 'lodash';

import addToHeaderSearchPaths from './addToHeaderSearchPaths';
import getHeadersInFolder from './getHeadersInFolder';
import getHeaderSearchPath from './getHeaderSearchPath';
import getTargets from './getTargets';
import createGroupWithMessage from './createGroupWithMessage';
import addFileToProject from './addFileToProject';
import addProjectToLibraries from './addProjectToLibraries';
import addSharedLibraries from './addSharedLibraries';

/**
 * Register native module IOS adds given dependency to project by adding
 * its xcodeproj to project libraries as well as attaching static library
 * to the first target (the main one)
 *
 * If library is already linked, this action is a no-op.
 */
module.exports = function registerNativeModuleIOS(
  dependencyConfig,
  projectConfig
) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const dependencyProject = xcode
    .project(dependencyConfig.pbxprojPath)
    .parseSync();

  const libraries = createGroupWithMessage(
    project,
    projectConfig.libraryFolder
  );
  const file = addFileToProject(
    project,
    path.relative(projectConfig.sourceDir, dependencyConfig.projectPath)
  );

  const targets = getTargets(project);

  addProjectToLibraries(libraries, file);

  getTargets(dependencyProject).forEach(product => {
    let i;
    if (!product.isTVOS) {
      for (i = 0; i < targets.length; i++) {
        if (!targets[i].isTVOS) {
          project.addStaticLibrary(product.name, {
            target: targets[i].uuid,
          });
        }
      }
    }

    if (product.isTVOS) {
      for (i = 0; i < targets.length; i++) {
        if (targets[i].isTVOS) {
          project.addStaticLibrary(product.name, {
            target: targets[i].uuid,
          });
        }
      }
    }
  });

  addSharedLibraries(project, dependencyConfig.sharedLibraries);

  const headers = getHeadersInFolder(dependencyConfig.folder);
  if (!isEmpty(headers)) {
    addToHeaderSearchPaths(
      project,
      getHeaderSearchPath(projectConfig.sourceDir, headers)
    );
  }

  fs.writeFileSync(projectConfig.pbxprojPath, project.writeSync());
};
