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
import process from 'process';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';

interface Options {
  showPodsInstructions?: boolean;
}

function printRunInstructions(
  projectDir: string,
  projectName: string,
  options: Options = {
    showPodsInstructions: false,
  },
) {
  let iosInstructions = '';
  let desktopInstructions = '';

  if (process.platform === 'darwin') {
    const iosProjectDir = path.resolve(projectDir, 'ios');
    const iosPodsFile = path.resolve(
      iosProjectDir,
      `${projectName}.xcworkspace`,
    );
    const isUsingPods = fs.existsSync(iosPodsFile);

    const relativeXcodeProjectPath = path.relative(
      '..',
      isUsingPods
        ? iosPodsFile
        : path.resolve(iosProjectDir, `${projectName}.xcodeproj`),
    );

    iosInstructions = `
  ${chalk.cyan(`Run instructions for ${chalk.bold('iOS')}`)}:
    • cd "${projectDir}${options.showPodsInstructions ? '/ios' : ''}"
    ${
      options.showPodsInstructions
        ? `
    • Install Cocoapods
      • bundle install # you need to run this only once in your project.
      • bundle exec pod install
      • cd ..
    `
        : ''
    }
    • npx react-native run-ios
    ${chalk.dim('- or -')}
    • Open ${relativeXcodeProjectPath} in Xcode or run "xed -b ios"
    • Hit the Run button
    `;

    desktopInstructions = `
  ${chalk.magenta(`Run instructions for ${chalk.bold('macOS')}`)}:
    • See ${chalk.underline(
      'https://microsoft.github.io/react-native-macos',
    )} for the latest up-to-date instructions.
    `;
  }

  if (process.platform === 'win32') {
    desktopInstructions = `
  ${chalk.cyan(`Run instructions for ${chalk.bold('Windows')}`)}:
    • See ${chalk.underline(
      'https://microsoft.github.io/react-native-windows',
    )} for the latest up-to-date instructions.
    `;
  }

  const androidInstructions = `
  ${chalk.green(`Run instructions for ${chalk.bold('Android')}`)}:
    • Have an Android emulator running (quickest way to get started), or a device connected.
    • cd "${projectDir}" && npx react-native run-android
  `;

  logger.log(`
  ${androidInstructions}${iosInstructions}${desktopInstructions}
  `);
}

export default printRunInstructions;
