/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import { spawnSync } from 'child_process';
import logger from '../util/logger';
import PackageManager from '../util/PackageManager';

const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

function uninstall(args, ctx) {
  const name = args[0];

  let res = spawnSync('react-native', ['unlink', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  res = PackageManager.remove(name, ctx.root);

  if (res.status) {
    process.exit(res.status);
  }

  logger.info(`Module ${name} has been successfully uninstalled & unlinked`);
}

module.exports = {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
