/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import isInstalledIOS from '../isInstalled';
import isInstalledPods from '../../link-pods/isInstalled';

export default function isInstalled(projectConfig, name, dependencyConfig) {
  return (
    isInstalledIOS(projectConfig, dependencyConfig) ||
    isInstalledPods(projectConfig, dependencyConfig)
  );
}
