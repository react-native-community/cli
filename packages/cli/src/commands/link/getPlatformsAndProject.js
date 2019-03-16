// @flow
import {pick} from 'lodash';
import getProjectConfig from './getProjectConfig';
import getPlatforms, {getPlatformName} from '../../tools/getPlatforms';
import logger from '../../tools/logger';
import type {ContextT} from '../../tools/types.flow';
import type {LinkOptions} from './types.flow';

function getPlatformsAndProject(ctx: ContextT, opts: LinkOptions) {
  let platforms = getPlatforms(ctx.root);
  logger.debug(
    'Available platforms: ' +
      `${Object.getOwnPropertyNames(platforms)
        .map(platform => getPlatformName(platform))
        .join(', ')}`,
  );
  if (opts.platforms) {
    platforms = pick(platforms, opts.platforms);
  }

  logger.debug(
    'Targeted platforms: ' +
      `${Object.getOwnPropertyNames(platforms)
        .map(platform => getPlatformName(platform))
        .join(', ')}`,
  );

  return {
    platforms,
    project: getProjectConfig(ctx, platforms),
  };
}

export default getPlatformsAndProject;
