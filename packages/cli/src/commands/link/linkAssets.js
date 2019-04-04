// @flow

import {isEmpty} from 'lodash';
import type {PlatformsT, ProjectConfigT} from '../../tools/config/types.flow';

import {logger} from '@react-native-community/cli-tools';

const linkAssets = (
  platforms: PlatformsT,
  project: ProjectConfigT,
  assets: Array<string>,
) => {
  if (isEmpty(assets)) {
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
    linkConfig.copyAssets(assets, project[platform]);
  });

  logger.info('Assets have been successfully linked to your project');
};

export default linkAssets;
