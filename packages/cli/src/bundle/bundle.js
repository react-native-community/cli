/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(_, config, args, output) {
  return buildBundle(args, config, output);
}

module.exports = {
  name: 'bundle',
  description: 'builds the javascript bundle for offline use',
  func: bundleWithOutput,
  options: bundleCommandLineArgs,
  // Used by `ramBundle.js`
  withOutput: bundleWithOutput,
};
