/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {Config} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../../tools/packageManager';
import unlink from '../link/unlink';
import chalk from 'chalk';

async function uninstall(args: Array<string>, ctx: Config): Promise<void> {
  const name = args[0];

  if (!Object.keys(ctx.dependencies).includes(name)) {
    logger.error(
      `Unknown package name "${chalk.bgRed.dim(
        name,
      )}". The package you are trying to uninstall is not present in your "package.json" dependencies.`,
    );
    logger.info(
      `${chalk.bold(
        'We found the following dependencies installed in your project:\n',
      )}${chalk.green.dim(
        Object.keys(ctx.dependencies)
          .map(dependency => `     - ${dependency}`)
          .join('\n'),
      )}`,
    );
    process.exit();
  }

  logger.info(`Unlinking "${name}"...`);
  await unlink.func([name], ctx, {});

  logger.info(`Uninstalling "${name}"...`);
  await PackageManager.uninstall([name], {root: ctx.root});

  logger.success(`Successfully uninstalled and unlinked "${name}"`);
}

export default {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
