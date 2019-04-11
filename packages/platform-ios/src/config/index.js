/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import path from 'path';
import findProject from './findProject';
import findPodfilePath from './findPodfilePath';
import findPodspecName from './findPodspecName';
import type {UserConfigT} from '../../../../types/config';

/**
 * For libraries specified without an extension, add '.tbd' for those that
 * start with 'lib' and '.framework' to the rest.
 */
const mapSharedLibaries = libraries =>
  libraries.map<string>(name => {
    if (path.extname(name)) {
      return name;
    }
    return name + (name.indexOf('lib') === 0 ? '.tbd' : '.framework');
  });

/**
 * Returns project config by analyzing given folder and applying some user defaults
 * when constructing final object
 */
export function projectConfig(
  folder: string,
  userConfig: $PropertyType<$PropertyType<UserConfigT, 'project'>, 'ios'>,
) {
  if (!userConfig) {
    return;
  }
  const project = userConfig.project || findProject(folder);

  /**
   * No iOS config found here
   */
  if (!project) {
    return null;
  }

  const projectPath = path.join(folder, project);

  return {
    sourceDir: path.dirname(projectPath),
    folder,
    pbxprojPath: path.join(projectPath, 'project.pbxproj'),
    podfile: findPodfilePath(projectPath),
    podspec: findPodspecName(folder),
    projectPath,
    projectName: path.basename(projectPath),
    libraryFolder: userConfig.libraryFolder || 'Libraries',
    sharedLibraries: mapSharedLibaries(userConfig.sharedLibraries || []),
    plist: userConfig.plist || [],
  };
}

export const dependencyConfig = projectConfig;
