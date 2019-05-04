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
function getOS() {
  var platform = window.navigator.platform,
    macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
    windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
    os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (!os && /Linux/.test(platform)) {
    os = 'Linux';
  }

  return os;
}

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : getOS() === 'Windows'
    ? `C:/Users/${
        require('os').userInfo().username
      }/AppData/Local/Android/Sdk/platform-tools/adb`
    : `/Users/${
        require('os').userInfo().username
      }/Library/Android/sdk/platform-tools/adb`;
}

var _default = getAdbPath;
exports.default = _default;
