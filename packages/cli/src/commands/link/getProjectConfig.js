/**
 * @flow
 */

import type {
  PlatformsT,
  ContextT,
  ProjectConfigT,
} from '../../tools/types.flow';

import getPackageConfiguration from '../../tools/getPackageConfiguration';
import {getPlatformName} from '../../tools/getPlatforms';
import logger from '../../tools/logger';

export default function getProjectConfig(
  ctx: ContextT,
  availablePlatforms: PlatformsT,
): ProjectConfigT {
  const config = getPackageConfiguration(ctx.root);

  const platformConfigs = {ios: undefined, android: undefined};

  Object.keys(availablePlatforms).forEach(platform => {
    logger.debug(`Getting project config for ${getPlatformName(platform)}...`);
    platformConfigs[platform] = availablePlatforms[platform].projectConfig(
      ctx.root,
      // $FlowIssue: Flow can't match platform config with its appropriate config function
      config[platform] || {},
    );
  });

  return platformConfigs;
}
