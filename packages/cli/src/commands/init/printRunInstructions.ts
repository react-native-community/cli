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
import pico from 'picocolors';
import {logger} from '@react-native-community/cli-tools';
import {SPM_SETUP_COMMAND, SpmSetup} from './spm';

interface Options {
  showPodsInstructions?: boolean;
  spmSetup?: SpmSetup;
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
    const isUsingSpm = !!options.spmSetup;
    const isUsingPods = !isUsingSpm && fs.existsSync(iosPodsFile);
    const showPodsInstructions = !isUsingSpm && options.showPodsInstructions;

    const relativeXcodeProjectPath = path.relative(
      '..',
      isUsingPods
        ? iosPodsFile
        : path.resolve(iosProjectDir, `${projectName}.xcodeproj`),
    );

    // A failed setup can leave either the .xcodeproj or the .xcworkspace as the file to open.
    const xcodeInstruction =
      options.spmSetup === 'failed'
        ? 'Open the iOS project in Xcode with "xed -b ios"'
        : `Open ${relativeXcodeProjectPath} in Xcode or run "xed -b ios"`;

    let dependencyInstructions = '';
    if (showPodsInstructions) {
      dependencyInstructions = `
    • Install Cocoapods
      • bundle install # you need to run this only once in your project.
      • bundle exec pod install
      • cd ..
    `;
    } else if (options.spmSetup === 'pending') {
      dependencyInstructions = `
    • Set up Swift Package Manager once dependencies are installed
      • ${SPM_SETUP_COMMAND}
    `;
    } else if (options.spmSetup === 'failed') {
      dependencyInstructions = `
    • Retry the Swift Package Manager setup
      • ${SPM_SETUP_COMMAND}
    `;
    }

    iosInstructions = `
  ${pico.cyan(`Run instructions for ${pico.bold('iOS')}`)}:
    • cd "${projectDir}${showPodsInstructions ? '/ios' : ''}"
    ${dependencyInstructions}
    • npx react-native run-ios
    ${pico.dim('- or -')}
    • ${xcodeInstruction}
    • Hit the Run button
    `;

    desktopInstructions = `
  ${pico.magenta(`Run instructions for ${pico.bold('macOS')}`)}:
    • See ${pico.underline(
      'https://microsoft.github.io/react-native-macos',
    )} for the latest up-to-date instructions.
    `;
  }

  if (process.platform === 'win32') {
    desktopInstructions = `
  ${pico.cyan(`Run instructions for ${pico.bold('Windows')}`)}:
    • See ${pico.underline(
      'https://microsoft.github.io/react-native-windows',
    )} for the latest up-to-date instructions.
    `;
  }

  const androidInstructions = `
  ${pico.green(`Run instructions for ${pico.bold('Android')}`)}:
    • Have an Android emulator running (quickest way to get started), or a device connected.
    • cd "${projectDir}" && npx react-native run-android
  `;

  logger.log(`
  ${androidInstructions}${iosInstructions}${desktopInstructions}
  `);
}

export default printRunInstructions;
