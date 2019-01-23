// @flow

import type { PlatformsT, ProjectConfigT } from '../core/types.flow';

const log = require('npmlog');
const { isEmpty } = require('lodash');

log.heading = 'rnpm-link';

const linkAssets = (
  platforms: PlatformsT,
  project: ProjectConfigT,
  dependency: *
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

    log.info(`Linking assets to ${platform} project`);
    // $FlowFixMe: We check for existence of project[platform]
    linkConfig.copyAssets(dependency.assets, project[platform]);
  });

  log.info('Assets have been successfully linked to your project');
};

module.exports = linkAssets;
