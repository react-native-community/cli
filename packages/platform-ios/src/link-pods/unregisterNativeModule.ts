/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import removePodEntry from './removePodEntry';
import {logger} from '@react-native-community/cli-tools';
import {
  IOSDependencyConfig,
  IOSProjectConfig,
} from '@react-native-community/cli-types';

/**
 * Unregister native module IOS with CocoaPods
 */
export default function unregisterNativeModule(
  dependencyConfig: IOSDependencyConfig,
  iOSProject: IOSProjectConfig,
) {
  const podContent = fs.readFileSync(iOSProject.podfile, 'utf8');
  const removed = removePodEntry(podContent, dependencyConfig.podspecPath);
  logger.debug(`Writing changes to ${iOSProject.podfile}`);
  fs.writeFileSync(iOSProject.podfile, removed);
}
