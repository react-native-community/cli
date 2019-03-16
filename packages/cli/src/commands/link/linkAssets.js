// @flow
import {isEmpty} from 'lodash';
import type {
  PlatformsT,
  ProjectConfigT,
  ContextT,
} from '../../tools/types.flow';
import type {LinkFlagsType} from './types.flow';
import logger from '../../tools/logger';
import getPlatformsAndProject from './getPlatformsAndProject';
import getAssets from '../../tools/getAssets';
import {ReactNativeNotFound} from '../../tools/errors';

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

function linkAssetsCommand(
  _: Array<string>,
  ctx: ContextT,
  opts: LinkFlagsType,
) {
  try {
    const {platforms, project} = getPlatformsAndProject(ctx, opts);
    const projectAssets = getAssets(ctx.root);

    return linkAssets(platforms, project, projectAssets);
  } catch (err) {
    throw new ReactNativeNotFound();
  }
}

export {linkAssets};

export default {
  func: linkAssetsCommand,
  description: 'link project assets to certain platforms (comma-separated)',
  name: 'link-assets',
  options: [
    {
      command: '--platforms [list]',
      description:
        'If you want to link dependencies only for specific platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};
