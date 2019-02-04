/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const path = require('path');
const logger = require('../util/logger');

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
  logger.info(chalk.white.bold('To run your app on iOS:'));
  logger.info(`   cd ${absoluteProjectDir}`);
  logger.info('   react-native run-ios');
  logger.info('   - or -');
  logger.info(`   Open ${relativeXcodeProjectPath} in Xcode`);
  logger.info('   Hit the Run button');
  // Android
  logger.info(chalk.white.bold('To run your app on Android:'));
  logger.info(`   cd ${absoluteProjectDir}`);
  logger.info(
    '   Have an Android emulator running (quickest way to get started), or a device connected'
  );
  logger.info('   react-native run-android');
}

module.exports = printRunInstructions;
