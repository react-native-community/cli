/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import isInstalled from './isInstalled';
import register from './registerNativeModule';
import unregister from './unregisterNativeModule';
import copyAssets from './copyAssets';
import unlinkAssets from './unlinkAssets';

export function getAndroidLinkConfig() {
  return {isInstalled, register, unregister, copyAssets, unlinkAssets};
}

export default getAndroidLinkConfig;
