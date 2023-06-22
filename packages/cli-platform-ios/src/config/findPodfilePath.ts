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

// Podfile in the bundle package
const BUNDLE_VENDORED_PODFILE = 'vendor/bundle/ruby';

export default function findPodfilePath(cwd: string) {
  const podfiles = findAllPodfilePaths(cwd)
    /**
     * Then, we will run a simple test to rule out most example projects,
     * unless they are located in a `ios` folder
     */
    .filter((project) => {
      if (path.dirname(project) === IOS_BASE) {
        // Pick the Podfile in the default project (in the iOS folder)
        return true;
      }

      if (TEST_PROJECTS.test(project)) {
        // Ignore the Podfile in test and example projects
        return false;
      }

      if (project.indexOf(BUNDLE_VENDORED_PODFILE) > -1) {
        // Ignore the podfile shipped with Cocoapods in bundle
        return false;
      }

      // Accept all the others
      return true;
    })
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
          You can learn more about it here: https://github.com/react-native-community/cli/blob/main/docs/configuration.md
        `),
      );
    }
    return path.join(cwd, podfiles[0]);
  }

  return null;
}
