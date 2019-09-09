/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import isInstalledIOS from '../isInstalled';
import isInstalledPods from '../../link-pods/isInstalled';
import {
  IOSProjectConfig,
  IOSDependencyConfig,
} from '@react-native-community/cli-types';

export default function isInstalled(
  projectConfig: IOSProjectConfig,
  // FIXME: name is never used
  _name: string | undefined,
  dependencyConfig: IOSDependencyConfig,
) {
  return (
    isInstalledIOS(projectConfig, dependencyConfig) ||
    isInstalledPods(projectConfig, dependencyConfig)
  );
}
