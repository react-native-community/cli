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
import findPodspec from './findPodspec';
import {
  IOSProjectParams,
  IOSProjectConfig,
} from '@react-native-community/cli-types';

const memoizedFindProject = memoize(findProject);

export function projectConfig(
  folder: string,
  userConfig: IOSProjectParams | null,
): IOSProjectConfig | null {
  if (!userConfig) {
    return null;
  }

  const project = userConfig.project || memoizedFindProject(folder);

  if (!project) {
    return null;
  }

  const projectPath = path.join(folder, project);
  const sourceDir = path.dirname(projectPath);

  return {
    sourceDir,
    podspecPath:
      userConfig.podspecPath ||
      // podspecs are usually placed in the root dir of the library or in the
      // iOS project path
      findPodspec(folder) ||
      findPodspec(sourceDir),
    scriptPhases: userConfig.scriptPhases || [],
  };
}

export const dependencyConfig = projectConfig;
