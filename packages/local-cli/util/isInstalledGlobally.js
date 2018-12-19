/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const isWindows = process.platform === 'win32';

module.exports = function isInstalledGlobally() {
  if (isWindows) {
    const fs = require('fs');
    const path = require('path');
    // On Windows, assume we are installed globally if we can't find a
    // package.json above node_modules.
    return !fs.existsSync(path.join(__dirname, '../../../package.json'));
  }
  // On non-windows, assume we are installed globally if we are called from
  // outside of the node_mobules/.bin/react-native executable.
  const script = process.argv[1];
  return script.indexOf('node_modules/.bin/react-native') === -1;
};
