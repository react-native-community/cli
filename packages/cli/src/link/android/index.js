/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = function getAndroidLinkConfig() {
  return {
    isInstalled: require('./isInstalled'),
    register: require('./registerNativeModule'),
    unregister: require('./unregisterNativeModule'),
    copyAssets: require('./copyAssets'),
    unlinkAssets: require('./unlinkAssets'),
  };
};
