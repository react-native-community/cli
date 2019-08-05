/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {compact} from 'lodash';
import isInstalledIOS from '../isInstalled';
import isInstalledPods from '../../link-pods/isInstalled';
import unregisterDependencyIOS from '../unregisterNativeModule';
import unregisterDependencyPods from '../../link-pods/unregisterNativeModule';
import {
  IOSDependencyConfig,
  IOSProjectConfig,
} from '@react-native-community/cli-types';

export default function unregisterNativeModule(
  _name: string,
  dependencyConfig: IOSDependencyConfig,
  projectConfig: IOSProjectConfig,
  // FIXME: Add type signature here
  otherDependencies: Array<any>,
) {
  const isIosInstalled = isInstalledIOS(projectConfig, dependencyConfig);
  const isPodInstalled = isInstalledPods(projectConfig, dependencyConfig);
  if (isIosInstalled) {
    const iOSDependencies = compact(
      otherDependencies.map(d => d.platforms.ios),
    );
    unregisterDependencyIOS(dependencyConfig, projectConfig, iOSDependencies);
  } else if (isPodInstalled) {
    unregisterDependencyPods(dependencyConfig, projectConfig);
  }
}
