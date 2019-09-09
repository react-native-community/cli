/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import {memoize} from 'lodash';
import findProject from './findProject';
import findPodfilePath from './findPodfilePath';
import findPodspec from './findPodspec';
import {IOSProjectParams} from '@react-native-community/cli-types';

const memoizedFindProject = memoize(findProject);

/**
 * For libraries specified without an extension, add '.tbd' for those that
 * start with 'lib' and '.framework' to the rest.
 */
const mapSharedLibaries = (libraries: Array<string>) =>
  libraries.map(name => {
    if (path.extname(name)) {
      return name;
    }
    return name + (name.indexOf('lib') === 0 ? '.tbd' : '.framework');
  });

/**
 * Returns project config by analyzing given folder and applying some user defaults
 * when constructing final object
 */
export function projectConfig(folder: string, userConfig: IOSProjectParams) {
  if (!userConfig) {
    return;
  }
  const project = userConfig.project || memoizedFindProject(folder);

  /**
   * No iOS config found here
   */
  if (!project) {
    return null;
  }

  const projectPath = path.join(folder, project);
  const sourceDir = path.dirname(projectPath);

  return {
    sourceDir,
    folder,
    pbxprojPath: path.join(projectPath, 'project.pbxproj'),
    podfile: findPodfilePath(projectPath),
    podspecPath:
      userConfig.podspecPath ||
      // podspecs are usually placed in the root dir of the library or in the
      // iOS project path
      findPodspec(folder) ||
      findPodspec(sourceDir),
    projectPath,
    projectName: path.basename(projectPath),
    libraryFolder: userConfig.libraryFolder || 'Libraries',
    sharedLibraries: mapSharedLibaries(userConfig.sharedLibraries || []),
    plist: userConfig.plist || [],
    scriptPhases: userConfig.scriptPhases || [],
  };
}

export const dependencyConfig = projectConfig;
