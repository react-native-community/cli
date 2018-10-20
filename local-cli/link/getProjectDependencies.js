/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');

/**
 * Returns an array of dependencies that should be linked/checked.
 */
module.exports = function getProjectDependencies(cwd) {
  const pjson = require(path.join(cwd || process.cwd(), './package.json'));
  return Object.keys(pjson.dependencies || {}).filter(
    name => name !== 'react-native',
  );
};
