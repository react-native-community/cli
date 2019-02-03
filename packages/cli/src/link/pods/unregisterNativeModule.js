/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import removePodEntry from './removePodEntry';

/**
 * Unregister native module IOS with CocoaPods
 */
module.exports = function unregisterNativeModule(dependencyConfig, iOSProject) {
  const podContent = fs.readFileSync(iOSProject.podfile, 'utf8');
  const removed = removePodEntry(podContent, dependencyConfig.podspec);
  fs.writeFileSync(iOSProject.podfile, removed);
};
