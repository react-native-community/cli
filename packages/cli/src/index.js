/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// gracefulify() has to be called before anything else runs
require('graceful-fs').gracefulify(require('fs'));

const cli = require('./cliEntry');

if (require.main === module) {
  cli.run();
}

module.exports = cli;
