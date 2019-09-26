/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  IOSDependencyConfig,
  IOSProjectConfig,
} from '@react-native-community/cli-types';
import registerDependencyIOS from '../registerNativeModule';
import registerDependencyPods from '../../link-pods/registerNativeModule';

export default function registerNativeModule(
  name: string,
  dependencyConfig: IOSDependencyConfig,
  // FIXME: Params is never used
  _params: any | undefined,
  projectConfig: IOSProjectConfig,
) {
  if (projectConfig.podfile && dependencyConfig.podspecPath) {
    registerDependencyPods(name, dependencyConfig.podspecPath, projectConfig);
  } else {
    registerDependencyIOS(dependencyConfig, projectConfig);
  }
}
