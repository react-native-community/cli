/**
 * @flow
 */

import path from 'path';
import type {
  PlatformsT,
  ContextT,
  DependenciesConfig,
} from '../core/types.flow';

import getPackageConfiguration from '../core/getPackageConfiguration';
import getParams from '../core/getParams';
import getHooks from '../core/getHooks';
import getAssets from '../core/getAssets';

export default function getDependencyConfig(
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
}
