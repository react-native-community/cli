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

async function uninstall(args, ctx) {
  const name = args[0];

  const res = spawnSync('react-native', ['unlink', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  new PackageManager({ projectDir: ctx.root }).uninstall([name]);

  logger.info(`Module ${name} has been successfully uninstalled & unlinked`);
}

export default {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
