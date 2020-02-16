/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

function printRunInstructions(projectDir: string, projectName: string) {
  const iosProjectDir = path.resolve(projectDir, 'ios');
  const iosPodsFile = path.resolve(iosProjectDir, `${projectName}.xcworkspace`);
  const isUsingPods = fs.existsSync(iosPodsFile);

  const relativeXcodeProjectPath = path.relative(
    '..',
    isUsingPods
      ? iosPodsFile
      : path.resolve(iosProjectDir, `${projectName}.xcodeproj`),
  );

  logger.log(`
  ${chalk.cyan(`Run instructions for ${chalk.bold('iOS')}`)}:
    • cd "${projectDir}" && npx react-native run-ios
    ${chalk.dim('- or -')}
    • Open ${relativeXcodeProjectPath} in Xcode or run "xed -b ios"
    • Hit the Run button

  ${chalk.green(`Run instructions for ${chalk.bold('Android')}`)}:
    • Have an Android emulator running (quickest way to get started), or a device connected.
    • cd "${projectDir}" && npx react-native run-android
`);
}

export default printRunInstructions;
