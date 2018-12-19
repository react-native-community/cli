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

type DependenciesConfig = Array<{
  config: DependencyConfigT,
  name: string,
  path: string,
  assets: string[],
  commands: { [name: string]: string },
  params: InquirerPromptT[],
}>;

module.exports = function getDependencyConfig(
  ctx: ContextT,
  availablePlatforms: PlatformsT,
  dependencies: string[]
): DependenciesConfig {
  return dependencies.reduce((acc, packageName) => {
    try {
      const folder = path.join(ctx.root, 'node_modules', packageName);
      const config = getPackageConfiguration(folder);

      const platformConfigs = { ios: undefined, android: undefined };

      Object.keys(availablePlatforms).forEach(platform => {
        platformConfigs[platform] = availablePlatforms[
          platform
        ].dependencyConfig(folder, config[platform] || {});
      });

      return acc.concat({
        config: platformConfigs,
        name: packageName,
        path: folder,
        commands: getHooks(folder),
        assets: getAssets(folder),
        params: getParams(folder),
      });
    } catch (e) {
      return acc;
    }
  }, []);
};
