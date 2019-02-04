/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export default function getAndroidLinkConfig() {
  return {
    isInstalled: require('./isInstalled').default,
    register: require('./registerNativeModule').default,
    unregister: require('./unregisterNativeModule').default,
    copyAssets: require('./copyAssets').default,
    unlinkAssets: require('./unlinkAssets').default,
  };
}
