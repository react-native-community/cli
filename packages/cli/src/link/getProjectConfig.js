/**
 * @flow
 */

import type { PlatformsT, ContextT, ProjectConfigT } from '../core/types.flow';

import getPackageConfiguration from '../core/getPackageConfiguration';

export default function getProjectConfig(
  ctx: ContextT,
  availablePlatforms: PlatformsT
): ProjectConfigT {
  const config = getPackageConfiguration(ctx.root);

  const platformConfigs = { ios: undefined, android: undefined };

  Object.keys(availablePlatforms).forEach(platform => {
    platformConfigs[platform] = availablePlatforms[platform].projectConfig(
      ctx.root,
      config[platform] || {}
    );
  });

  return platformConfigs;
}
