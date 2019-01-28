/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// gracefulify() has to be called before anything else runs
import fs from 'fs';
import gracefulFs from 'graceful-fs';

gracefulFs.gracefulify(fs);

const cli = require('./cliEntry').default;

if (require.main === module) {
  cli.run();
}

export default cli;
