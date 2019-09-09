/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import isInstalled from './common/isInstalled';
import register from './common/registerNativeModule';
import unregister from './common/unregisterNativeModule';
import copyAssets from './copyAssets';
import unlinkAssets from './unlinkAssets';

export function getIOSLinkConfig() {
  return {isInstalled, register, unregister, copyAssets, unlinkAssets};
}

export default getIOSLinkConfig;
