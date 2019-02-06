/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import { compact } from 'lodash';
import isInstalledIOS from '../isInstalled';
import isInstalledPods from '../../pods/isInstalled';
import unregisterDependencyIOS from '../unregisterNativeModule';
import unregisterDependencyPods from '../../pods/unregisterNativeModule';

module.exports = function unregisterNativeModule(
  name,
  dependencyConfig,
  projectConfig,
  otherDependencies
) {
  const isIosInstalled = isInstalledIOS(projectConfig, dependencyConfig);
  const isPodInstalled = isInstalledPods(projectConfig, dependencyConfig);
  if (isIosInstalled) {
    const iOSDependencies = compact(otherDependencies.map(d => d.config.ios));
    unregisterDependencyIOS(dependencyConfig, projectConfig, iOSDependencies);
  } else if (isPodInstalled) {
    unregisterDependencyPods(dependencyConfig, projectConfig);
  }
};
