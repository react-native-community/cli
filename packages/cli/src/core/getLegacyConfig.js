/**
 * @flow
 */
import path from 'path';
import util from 'util';

import getPlatforms from './getPlatforms';
import getPackageConfiguration from './getPackageConfiguration';
import getHooks from './getHooks';
import getAssets from './getAssets';
import getParams from './getParams';

const generateDeprecationMessage = api =>
  `${api} is deprecated and will be removed soon. Please check release notes on how to upgrade`;

/**
 * Gets legacy configuration to support existing plugins while they migrate
 * to the new API
 *
 * This file will be removed from the next version.
 */
module.exports = (root: string) => ({
  getPlatformConfig: util.deprecate(
    () => getPlatforms(root),
    generateDeprecationMessage('getPlatformConfig()')
  ),
  getProjectConfig: util.deprecate(() => {
    const platforms = getPlatforms(root);

    const rnpm = getPackageConfiguration(root);

    const config = {
      ...rnpm,
      assets: getAssets(root),
    };

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].projectConfig(root, rnpm[key] || {});
    });

    return config;
  }, generateDeprecationMessage('getProjectConfig()')),
  getDependencyConfig: util.deprecate((packageName: string) => {
    const platforms = getPlatforms(root);
    const folder = path.join(process.cwd(), 'node_modules', packageName);

    const rnpm = getPackageConfiguration(folder);

    const config = {
      ...rnpm,
      assets: getAssets(folder),
      commands: getHooks(folder),
      params: getParams(folder),
    };

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].dependencyConfig(folder, rnpm[key] || {});
    });

    return config;
  }, generateDeprecationMessage('getDependencyConfig()')),
});
