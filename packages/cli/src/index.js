/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// gracefulify() has to be called before anything else runs
// eslint-disable-next-line no-unused-vars
import gracefulFs from './util/gracefulFs';

import cli from './cliEntry';

if (require.main === module) {
  cli.run();
}

module.exports = cli;
