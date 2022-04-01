/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {CLIError} from '@react-native-community/cli-tools';
import fs from 'fs';
import makeBuildPatch from './patches/makeBuildPatch';

export default function isInstalled(
  config: {buildGradlePath: string},
  name: string,
) {
  let buildGradle: string;

  if (!fs.existsSync(config.buildGradlePath)) {
    // Handle default build.gradle path for Gradle Kotlin DSL
    if (!fs.existsSync(config.buildGradlePath + '.kts')) {
      throw new CLIError(
        'Cannot resolve build.gradle file at: ' + config.buildGradlePath,
      );
    } else {
      buildGradle = fs.readFileSync(config.buildGradlePath + '.kts', 'utf8');
    }
  } else {
    buildGradle = fs.readFileSync(config.buildGradlePath, 'utf8');
  }

  return makeBuildPatch(name).installPattern.test(buildGradle);
}
