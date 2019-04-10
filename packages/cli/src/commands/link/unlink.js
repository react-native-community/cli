/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {flatMap, values, difference} from 'lodash';
import type {ConfigT} from '../../tools/config/types.flow';
import {logger, CLIError} from '@react-native-community/cli-tools';
import promiseWaterfall from './promiseWaterfall';
import commandStub from './commandStub';
import promisify from './promisify';
import getPlatformName from './getPlatformName';

const unlinkDependency = (
  platforms,
  project,
  dependency,
  packageName,
  otherDependencies,
) => {
  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig = project[platform];
    const dependencyConfig = dependency.platforms[platform];
    if (!projectConfig || !dependencyConfig) {
      return;
    }

    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.unregister) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      projectConfig,
      packageName,
      dependencyConfig,
    );

    if (!isInstalled) {
      logger.info(
        `${getPlatformName(platform)} module "${packageName}" is not installed`,
      );
      return;
    }

    logger.info(
      `Unlinking "${packageName}" ${getPlatformName(platform)} dependency`,
    );

    linkConfig.unregister(
      packageName,
      dependencyConfig,
      projectConfig,
      otherDependencies,
    );

    logger.info(
      `${getPlatformName(platform)} module "${
        dependency.name
      }" has been successfully unlinked`,
    );
  });
};

/**
 * Updates project and unlink specific dependency
 *
 * If optional argument [packageName] is provided, it's the only one
 * that's checked
 */
function unlink(args: Array<string>, ctx: ConfigT) {
  const packageName = args[0];

  const {[packageName]: dependency, ...otherDependencies} = ctx.dependencies;

  if (!dependency) {
    throw new CLIError(`
      Failed to unlink "${packageName}". It appears that the project is not linked yet.
    `);
  }

  const dependencies = values(otherDependencies);

  const tasks = [
    () => promisify(dependency.hooks.preulink || commandStub),
    () =>
      unlinkDependency(
        ctx.platforms,
        ctx.project,
        dependency,
        packageName,
        dependencies,
      ),
    () => promisify(dependency.hooks.postunlink || commandStub),
  ];

  return promiseWaterfall(tasks)
    .then(() => {
      // @todo move all these to `tasks` array
      // @todo it is possible we could be unlinking some project assets in case of duplicate
      const assets = difference(
        dependency.assets,
        flatMap(dependencies, d => d.assets),
      );

      if (assets.length === 0) {
        return;
      }

      Object.keys(ctx.platforms || {}).forEach(platform => {
        const projectConfig = ctx.project[platform];
        const linkConfig =
          ctx.platforms[platform] &&
          ctx.platforms[platform].linkConfig &&
          ctx.platforms[platform].linkConfig();
        if (!linkConfig || !linkConfig.unlinkAssets || !projectConfig) {
          return;
        }

        logger.info(`Unlinking assets from ${platform} project`);

        linkConfig.unlinkAssets(assets, projectConfig);
      });

      logger.info(
        `${packageName} assets has been successfully unlinked from your project`,
      );
    })
    .catch(err => {
      throw new CLIError(
        `Something went wrong while unlinking. Reason ${err.message}`,
        err,
      );
    });
}

export default {
  func: unlink,
  description: 'unlink native dependency',
  name: 'unlink <packageName>',
};
