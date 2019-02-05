/**
 * @flow
 */

import glob from 'glob';
import path from 'path';
import getPackageConfiguration from './getPackageConfiguration';

const findAssetsInFolder = folder =>
  glob.sync(path.join(folder, '**'), { nodir: true });

/**
 * Given an array of assets folders, e.g. ['Fonts', 'Images'],
 * it globs in them to find all files that can be copied.
 *
 * It returns an array of absolute paths to files found.
 */
function findAssets(folder, assets) {
  return (assets || [])
    .map(asset => path.join(folder, asset))
    .reduce(
      (acc, assetPath) =>
        (acc.concat(findAssetsInFolder(assetPath)): Array<string>),
      []
    );
}

/**
 * Returns a project configuration in a given folder
 */
module.exports = function getAssets(root: string) {
  const config = getPackageConfiguration(root);
  return findAssets(root, config.assets);
};

module.exports.findAssets = findAssets;
