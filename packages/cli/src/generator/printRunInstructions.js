/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import path from 'path';
import logger from '../util/logger';

function printRunInstructions(projectDir, projectName) {
  const absoluteProjectDir = path.resolve(projectDir);
  // iOS
  const xcodeProjectPath = `${path.resolve(
    projectDir,
    'ios',
    projectName
  )}.xcodeproj`;
  const relativeXcodeProjectPath = path.relative(
    process.cwd(),
    xcodeProjectPath
  );
  logger.info(`To run your app on iOS:
    cd ${absoluteProjectDir}
    react-native run-ios');
    - or -
    Open ${relativeXcodeProjectPath} in Xcode
    Hit the Run button
  // Android
  To run your app on Android:
    cd ${absoluteProjectDir}
    Have an Android emulator running (quickest way to get started), or a device connected
    react-native run-android`);
}

module.exports = printRunInstructions;
