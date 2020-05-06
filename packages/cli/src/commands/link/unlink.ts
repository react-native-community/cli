/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {flatMap, values, difference, pick} from 'lodash';
import {logger, CLIError} from '@react-native-community/cli-tools';
import {
  Config,
  Dependency,
  AndroidDependencyConfig,
  AndroidProjectConfig,
  IOSDependencyConfig,
  IOSProjectConfig,
} from '@react-native-community/cli-types';
import getPlatformName from './getPlatformName';
import makeHook from './makeHook';
import printDeprecationWarning from './printDeprecationWarning';

type Flags = {
  platforms?: Array<string>;
};

const unlinkDependency = (
  platforms: Config['platforms'],
  project: Config['project'],
  dependency: Dependency,
  packageName: string,
  otherDependencies: Array<Dependency>,
) => {
  printDeprecationWarning('react-native unlink [packageName]');
  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig: AndroidProjectConfig | IOSProjectConfig =
      project[platform];
    const dependencyConfig: AndroidDependencyConfig | IOSDependencyConfig =
      dependency.platforms[platform];
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
async function unlink(args: Array<string>, ctx: Config, opts: Flags) {
  const packageName = args[0];
  let platforms = ctx.platforms;

  if (opts.platforms) {
    // @ts-ignore
    platforms = pick(platforms, opts.platforms);
    logger.debug('Skipping selected platforms');
  }

  logger.debug(
    `Available platforms: ${Object.keys(platforms)
      .map(getPlatformName)
      .join(', ')}`,
  );

  const {[packageName]: dependency, ...otherDependencies} = ctx.dependencies;

  if (!dependency) {
    throw new CLIError(`
      Failed to unlink "${packageName}". It appears that the project is not linked yet.
    `);
  }

  const dependencies = values(otherDependencies);
  try {
    if (dependency.hooks.preunlink) {
      await makeHook(dependency.hooks.preunlink)();
    }
    unlinkDependency(
      platforms,
      ctx.project,
      dependency,
      packageName,
      dependencies,
    );
    if (dependency.hooks.postunlink) {
      await makeHook(dependency.hooks.postunlink)();
    }
  } catch (error) {
    throw new CLIError(
      `Something went wrong while unlinking. Reason ${error.message}`,
      error,
    );
  }

  // @todo move all these to above try/catch
  // @todo it is possible we could be unlinking some project assets in case of duplicate
  const assets = difference(
    dependency.assets,
    flatMap(dependencies, d => d.assets),
  );

  if (assets.length === 0) {
    return;
  }

  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig = ctx.project[platform];
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();
    if (!linkConfig || !linkConfig.unlinkAssets || !projectConfig) {
      return;
    }

    logger.info(`Unlinking assets from ${platform} project`);

    linkConfig.unlinkAssets(assets, projectConfig);
  });

  logger.info(
    `${packageName} assets has been successfully unlinked from your project`,
  );
}

export default {
  func: unlink,
  description: 'unlink native dependency',
  name: 'unlink <packageName>',
  options: [
    {
      name: '--platforms [list]',
      description: 'Scope unlinking to specified platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};
