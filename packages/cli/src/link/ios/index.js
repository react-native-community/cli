/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export default function getIOSLinkConfig() {
  return {
    isInstalled: require('./common/isInstalled').default,
    register: require('./common/registerNativeModule').default,
    unregister: require('./common/unregisterNativeModule').default,
    copyAssets: require('./copyAssets').default,
    unlinkAssets: require('./unlinkAssets').default,
  };
}
