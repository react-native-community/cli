/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isInstalledIOS from '../isInstalled';
import isInstalledPods from '../../link-pods/isInstalled';
import type {ProjectConfigIOST, DependencyConfigIOST} from 'types';

export default function isInstalled(
  projectConfig: ProjectConfigIOST,
  name?: string,
  dependencyConfig: DependencyConfigIOST,
) {
  return (
    isInstalledIOS(projectConfig, dependencyConfig) ||
    isInstalledPods(projectConfig, dependencyConfig)
  );
}
