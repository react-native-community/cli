/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ContextT} from '../../tools/types.flow';
import logger from '../../tools/logger';
import PackageManager from '../../tools/PackageManager';
import link from '../link/unlink';

async function uninstall(args: Array<string>, ctx: ContextT) {
  const name = args[0];

  logger.info(`Unlinking "${name}"...`);
  await link.func([name], ctx);

  logger.info(`Uninstalling "${name}"...`);
  new PackageManager({projectDir: ctx.root}).uninstall([name]);

  logger.success(`Successfully uninstalled and unlinked "${name}"`);
}

export default {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
