#!/usr/bin/env node

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const isInstalledGlobally = require('./util/isInstalledGlobally');
const logger = require('./util/logger');

if (isInstalledGlobally()) {
  logger.error(
    [
      'Looks like you installed react-native globally, maybe you meant react-native-cli? ',
      'To fix the issue, run: ',
      chalk.white(
        'npm uninstall -g react-native && npm install -g react-native-cli'
      ),
    ].join('\n')
  );
  process.exit(1);
} else {
  require('.').run();
}
