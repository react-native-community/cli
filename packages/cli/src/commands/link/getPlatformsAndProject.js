// @flow
import {pick} from 'lodash';
import getProjectConfig from './getProjectConfig';
import getPlatforms from '../../tools/getPlatforms';
import type {ContextT} from '../../tools/types.flow';
import type {LinkFlagsType} from './types.flow';

function getPlatformsAndProject(ctx: ContextT, opts: LinkFlagsType) {
  let platforms = getPlatforms(ctx.root);
  if (opts.platforms) {
    platforms = pick(platforms, opts.platforms);
  }

  return {
    platforms,
    project: getProjectConfig(ctx, platforms),
  };
}

export default getPlatformsAndProject;
