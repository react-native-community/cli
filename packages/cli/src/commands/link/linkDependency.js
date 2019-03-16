// @flow

import type {
  PlatformsT,
  ProjectConfigT,
  DependenciesConfig,
} from '../../tools/types.flow';
import logger from '../../tools/logger';
import pollParams from './pollParams';
import {getPlatformName} from '../../tools/getPlatforms';

const linkDependency = async (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: DependenciesConfig,
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
      dependency.config[platform],
    );

    if (isInstalled) {
      logger.info(
        `${getPlatformName(platform)} module "${
          dependency.name
        }" is already linked`,
      );
      return;
    }

    logger.info(
      `Linking "${dependency.name}" ${getPlatformName(platform)} dependency`,
    );

    linkConfig.register(
      dependency.name,
      dependency.config[platform] || {},
      params,
      // $FlowFixMe: We check if project[platform] exists on line 42
      project[platform],
    );

    logger.info(
      `${getPlatformName(platform)} module "${
        dependency.name
      }" has been successfully linked`,
    );
  });
};

export default linkDependency;
