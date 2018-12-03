/**
 * @flow
 */

'use strict';

import type { PlatformsT, ContextT, ProjectConfigT } from '../core/types.flow';

const getPackageConfiguration = require('../core/getPackageConfiguration');

module.exports = function getProjectConfig(
  ctx: ContextT,
  availablePlatforms: PlatformsT
): ProjectConfigT {
  const config = getPackageConfiguration(ctx.root);
  
  let platformConfigs = {ios: null, android: null};

  Object.keys(availablePlatforms)
    .forEach(platform => {
      const platformConfig = availablePlatforms[platform]
        .projectConfig(ctx.root, config[platform] || {});
    });
  
  return platformConfigs;
};

 