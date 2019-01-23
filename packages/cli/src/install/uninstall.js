/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const { spawnSync } = require('child_process');
const log = require('npmlog');
const PackageManager = require('../util/PackageManager');

const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

function uninstall(args) {
  const name = args[0];

  let res = spawnSync('react-native', ['unlink', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  res = PackageManager.remove(name);

  if (res.status) {
    process.exit(res.status);
  }

  log.info(`Module ${name} has been successfully uninstalled & unlinked`);
}

module.exports = {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
