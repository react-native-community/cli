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
import fs from 'fs-extra';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

async function printRunInstructions(projectDir: string, projectName: string) {
  const absoluteProjectDir = path.resolve(projectDir);
  const iosProjectDir = path.resolve(projectDir, 'ios');

  const iosPodsFile = path.resolve(iosProjectDir, `${projectName}.xcworkspace`);
  const isUsingPods = await fs.pathExists(iosPodsFile);

  const relativeXcodeProjectPath = path.relative(
    process.cwd(),
    isUsingPods
      ? iosPodsFile
      : path.resolve(iosProjectDir, `${projectName}.xcodeproj`),
  );

  logger.log(`
  ${chalk.cyan(`Run instructions for ${chalk.bold('iOS')}`)}:
    • cd ${absoluteProjectDir} && react-native run-ios
    - or -
    • Open ${relativeXcodeProjectPath} in Xcode
    • Hit the Run button

  ${chalk.green(`Run instructions for ${chalk.bold('Android')}`)}:
    • Have an Android emulator running (quickest way to get started), or a device connected.
    • cd ${absoluteProjectDir} && react-native run-android
`);
}

export default printRunInstructions;
