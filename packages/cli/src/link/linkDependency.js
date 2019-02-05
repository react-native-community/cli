// @flow

import chalk from 'chalk';
import type { PlatformsT, ProjectConfigT } from '../core/types.flow';

import log from '../util/logger';
import pollParams from './pollParams';

const linkDependency = async (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: *
) => {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    if (!project[platform] || !dependency.config[platform]) {
      return;
    }

    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();
    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.register) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      project[platform],
      dependency.name,
      dependency.config[platform]
    );

    if (isInstalled) {
      log.info(
        chalk.grey(
          `Platform '${platform}' module ${dependency.name} is already linked`
        )
      );
      return;
    }

    log.info(`Linking ${dependency.name} ${platform} dependency`);

    linkConfig.register(
      dependency.name,
      // $FlowFixMe: We check if dependency.config[platform] exists on line 42
      dependency.config[platform],
      params,
      // $FlowFixMe: We check if project[platform] exists on line 42
      project[platform]
    );

    log.info(
      `Platform '${platform}' module ${
        dependency.name
      } has been successfully linked`
    );
  });
};

module.exports = linkDependency;
