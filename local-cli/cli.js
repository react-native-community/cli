/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// gracefulify() has to be called before anything else runs
require('graceful-fs').gracefulify(require('fs'));

// This file must be able to run in node 0.12 without babel so we can show that
// it is not supported. This is why the rest of the cli code is in `cliEntry.js`.
require('./server/checkNodeVersion')();

require('../setupBabel')();

var cliEntry = require('./cliEntry');

if (require.main === module) {
  cliEntry.run();
}

module.exports = cliEntry;
