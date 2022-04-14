/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {inlineString, logger} from '@react-native-community/cli-tools';
import path from 'path';
import findAllPodfilePaths from './findAllPodfilePaths';

// Regexp matching all test projects
const TEST_PROJECTS = /test|example|sample/i;

// Base iOS folder
const IOS_BASE = 'ios';

export default function findPodfilePath(cwd: string) {
  const podfiles = findAllPodfilePaths(cwd)
    /**
     * Then, we will run a simple test to rule out most example projects,
     * unless they are located in a `ios` folder
     */
    .filter(
      (project) =>
        path.dirname(project) === IOS_BASE || !TEST_PROJECTS.test(project),
    )
    /**
     * Podfile from `ios` folder will be picked up as a first one.
     */
    .sort((project) => (path.dirname(project) === IOS_BASE ? -1 : 1));

  if (podfiles.length > 0) {
    if (podfiles.length > 1) {
      logger.warn(
        inlineString(`
          Multiple Podfiles were found: ${podfiles}. Choosing ${podfiles[0]} automatically.
          If you would like to select a different one, you can configure it via "project.ios.sourceDir".
          You can learn more about it here: https://github.com/react-native-community/cli/blob/master/docs/configuration.md
        `),
      );
    }
    return path.join(cwd, podfiles[0]);
  }

  return null;
}
