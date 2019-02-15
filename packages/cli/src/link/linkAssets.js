// @flow

import { isEmpty } from 'lodash';
import type {
  PlatformsT,
  ProjectConfigT,
  DependenciesConfig,
} from '../core/types.flow';

import logger from '../util/logger';

const linkAssets = (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: DependenciesConfig
) => {
  if (isEmpty(dependency.assets)) {
    return;
  }

  Object.keys(platforms || {}).forEach(platform => {
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.copyAssets || !project[platform]) {
      return;
    }

    logger.info(`Linking assets to ${platform} project`);
    // $FlowFixMe: We check for existence of project[platform]
    linkConfig.copyAssets(dependency.assets, project[platform]);
  });

  logger.info('Assets have been successfully linked to your project');
};

export default linkAssets;
