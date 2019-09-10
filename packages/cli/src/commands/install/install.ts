/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
// @ts-ignore FIXME after converting link/link
import link from '../link/link';
// @ts-ignore FIXME after converting tools/config
import loadConfig from '../../tools/config';

async function install(args: Array<string>): Promise<void> {
  const name = args[0];

  logger.info(`Installing "${name}"...`);
  await PackageManager.install([name]);

  // Reload configuration to see newly installed dependency
  const newConfig = loadConfig();

  logger.info(`Linking "${name}"...`);
  await link.func([name], newConfig, {platforms: undefined});

  logger.success(`Successfully installed and linked "${name}"`);
}

export default {
  func: install,
  description: 'install and link native dependencies',
  name: 'install <packageName>',
};
