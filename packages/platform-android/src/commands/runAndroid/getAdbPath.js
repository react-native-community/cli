'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
// eslint-disable-next-line no-void
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function getAdbPath() {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : `C:/Users/${
        require('os').userInfo().username
      }/AppData/Local/Android/Sdk/platform-tools/adb`;
}

var _default = getAdbPath;
exports.default = _default;
