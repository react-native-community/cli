#!/usr/bin/env node

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const isInstalledGlobally = require('./util/isInstalledGlobally');

if (isInstalledGlobally()) {
  const chalk = require('chalk');

  console.error(
    [
      chalk.red(
        'Looks like you installed react-native globally, maybe you meant react-native-cli?'
      ),
      chalk.red('To fix the issue, run:'),
      'npm uninstall -g react-native',
      'npm install -g react-native-cli',
    ].join('\n')
  );
  process.exit(1);
} else {
  require('.').run();
}
