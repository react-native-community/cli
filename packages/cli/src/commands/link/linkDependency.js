// @flow

import type {
  DependencyConfigT,
  ProjectConfigT,
  PlatformsT,
} from '../../tools/config/types.flow';
import logger from '../../tools/logger';
import pollParams from './pollParams';
import {getPlatformName} from '../../tools/getPlatforms';

const linkDependency = async (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: DependencyConfigT,
) => {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    if (!project[platform] || !dependency.platforms[platform]) {
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
      dependency.platforms[platform],
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
      // $FlowExpectedError: We already checked if dependency.platforms[platform] exists
      dependency.platforms[platform],
      params,
      // $FlowFixMe: We already checked if project[platform] exists
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
