/**
 * @flow
 */

import type {
  PlatformsT,
  ContextT,
  InquirerPromptT,
  DependencyConfigT,
} from '../core/types.flow';

const path = require('path');

const getPackageConfiguration = require('../core/getPackageConfiguration');
const getParams = require('../core/getParams');
const getHooks = require('../core/getHooks');
const getAssets = require('../core/getAssets');

type DependenciesConfig = {
  config: DependencyConfigT,
  name: string,
  path: string,
  assets: string[],
  commands: { [name: string]: string },
  params: InquirerPromptT[],
};

module.exports = function getDependencyConfig(
  ctx: ContextT,
  availablePlatforms: PlatformsT,
  dependency: string
): DependenciesConfig {
  try {
    const folder = path.join(ctx.root, 'node_modules', dependency);
    const config = getPackageConfiguration(folder);

    const platformConfigs = { ios: undefined, android: undefined };

    Object.keys(availablePlatforms).forEach(platform => {
      platformConfigs[platform] = availablePlatforms[platform].dependencyConfig(
        folder,
        config[platform] || {}
      );
    });

    return {
      config: platformConfigs,
      name: dependency,
      path: folder,
      commands: getHooks(folder),
      assets: getAssets(folder),
      params: getParams(folder),
    };
  } catch (e) {
    throw new Error('Failed to get dependency config');
  }
};
