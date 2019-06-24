/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DependencyConfigIOST, ProjectConfigIOST} from 'types';
import registerDependencyIOS from '../registerNativeModule';
import registerDependencyPods from '../../link-pods/registerNativeModule';

export default function registerNativeModule(
  name: string,
  dependencyConfig: DependencyConfigIOST,
  params?: any,
  projectConfig: ProjectConfigIOST,
) {
  if (projectConfig.podfile && dependencyConfig.podspecPath) {
    registerDependencyPods(name, dependencyConfig.podspecPath, projectConfig);
  } else {
    registerDependencyIOS(dependencyConfig, projectConfig);
  }
}
