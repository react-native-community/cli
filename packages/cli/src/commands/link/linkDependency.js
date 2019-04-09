// @flow

import type {
  DependencyConfigT,
  ProjectConfigT,
  PlatformsT,
} from '../../tools/config/types.flow';
import {logger} from '@react-native-community/cli-tools';
import pollParams from './pollParams';
import getPlatformName from './getPlatformName';

const linkDependency = async (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: DependencyConfigT,
) => {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    const projectConfig = project[platform];
    const dependencyConfig = dependency.platforms[platform];

    if (!projectConfig || !dependencyConfig) {
      return;
    }
    const {name} = dependency;
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.register) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      projectConfig,
      name,
      dependencyConfig,
    );

    if (isInstalled) {
      logger.info(
        `${getPlatformName(platform)} module "${name}" is already linked`,
      );
      return;
    }

    logger.info(`Linking "${name}" ${getPlatformName(platform)} dependency`);

    linkConfig.register(name, dependencyConfig, params, projectConfig);

    logger.info(
      `${getPlatformName(platform)} module "${
        dependency.name
      }" has been successfully linked`,
    );
  });
};

export default linkDependency;
