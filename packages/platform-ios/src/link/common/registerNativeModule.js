/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import registerDependencyIOS from '../registerNativeModule';
import registerDependencyPods from '../../link-pods/registerNativeModule';

export default function registerNativeModule(
  name,
  dependencyConfig,
  params,
  projectConfig,
) {
  if (projectConfig.podfile && dependencyConfig.podspec) {
    registerDependencyPods(name, dependencyConfig, projectConfig);
  } else {
    registerDependencyIOS(dependencyConfig, projectConfig);
  }
}
