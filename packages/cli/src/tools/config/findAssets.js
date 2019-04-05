/**
 * @flow
 */

import glob from 'glob';
import path from 'path';

const findAssetsInFolder = folder =>
  glob.sync(path.join(folder, '**'), {nodir: true});

/**
 * Given an array of assets folders, e.g. ['Fonts', 'Images'],
 * it globs in them to find all files that can be copied.
 *
 * It returns an array of absolute paths to files found.
 */
export default function findAssets(folder: string, assets: string[]) {
  return (assets || [])
    .map(asset => path.join(folder, asset))
    .reduce(
      (acc, assetPath) =>
        (acc.concat(findAssetsInFolder(assetPath)): Array<string>),
      [],
    );
}
