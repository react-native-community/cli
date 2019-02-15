/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ContextT } from '../core/types.flow';
import logger from '../util/logger';
import PackageManager from '../util/PackageManager';
import link from '../link/link';

async function install(args: Array<string>, ctx: ContextT) {
  const name = args[0];

  logger.info(`Installing "${name}"...`);
  new PackageManager({ projectDir: ctx.root }).install([name]);

  logger.info(`Linking "${name}"...`);
  // eslint-disable-next-line import/no-named-as-default-member
  await link.func([name], ctx, { platforms: [] });

  logger.success(`Successfully installed and linked "${name}"`);
}

export default {
  func: install,
  description: 'install and link native dependencies',
  name: 'install <packageName>',
};
