/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ConfigT} from '../../tools/config/types.flow';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
import link from '../link/unlink';

async function uninstall(args: Array<string>, ctx: ConfigT) {
  const name = args[0];

  logger.info(`Unlinking "${name}"...`);
  await link.func([name], ctx);

  logger.info(`Uninstalling "${name}"...`);
  await PackageManager.uninstall([name]);

  logger.success(`Successfully uninstalled and unlinked "${name}"`);
}

export default {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
