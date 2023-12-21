/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  getBuildOptions,
  createBuild,
} from '@react-native-community/cli-platform-apple';

export default {
  name: 'build-ios',
  description: 'builds your app for iOS platform',
  func: createBuild({platformName: 'ios'}),
  examples: [
    {
      desc: 'Build the app for all iOS devices in Release mode',
      cmd: 'npx react-native build-ios --mode "Release"',
    },
  ],
  options: getBuildOptions({platformName: 'ios'}),
};
