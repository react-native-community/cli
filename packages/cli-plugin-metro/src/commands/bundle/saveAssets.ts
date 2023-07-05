/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import type {AssetData} from 'metro';
import path from 'path';
import filterPlatformAssetScales from './filterPlatformAssetScales';

interface CopiedFiles {
  [src: string]: string;
}

function saveAssets(
  assets: ReadonlyArray<AssetData>,
  platform: string,
  assetsDest: string | undefined,
  assetCatalogDest: string | undefined,
  saveAssetsPlugin: (
    assets: ReadonlyArray<AssetData>,
    platform: string,
    assetsDest: string | undefined,
    assetCatalogDest: string | undefined,
    addAssetToCopy: (
      asset: AssetData,
      allowedScales: number[] | undefined,
      getAssetDestPath: (asset: AssetData, scale: number) => string,
    ) => void,
  ) => void,
) {
  if (!assetsDest) {
    logger.warn('Assets destination folder is not set, skipping...');
    return;
  }

  const filesToCopy: CopiedFiles = Object.create(null); // Map src -> dest

  const addAssetToCopy = (
    asset: AssetData,
    allowedScales: number[] | undefined,
    getAssetDestPath: (asset: AssetData, scale: number) => string,
  ) => {
    const validScales = new Set(
      filterPlatformAssetScales(allowedScales, asset.scales),
    );

    asset.scales.forEach((scale: number, idx: number) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
      filesToCopy[src] = dest;
    });
  };

  saveAssetsPlugin(
    assets,
    platform,
    assetsDest,
    assetCatalogDest,
    addAssetToCopy,
  );
  return copyAll(filesToCopy);
}

function copyAll(filesToCopy: CopiedFiles) {
  const queue = Object.keys(filesToCopy);
  if (queue.length === 0) {
    return Promise.resolve();
  }

  logger.info(`Copying ${queue.length} asset files`);
  return new Promise<void>((resolve, reject) => {
    const copyNext = (error?: NodeJS.ErrnoException) => {
      if (error) {
        reject(error);
        return;
      }
      if (queue.length === 0) {
        logger.info('Done copying assets');
        resolve();
      } else {
        // queue.length === 0 is checked in previous branch, so this is string
        const src = queue.shift() as string;
        const dest = filesToCopy[src];
        copy(src, dest, copyNext);
      }
    };
    copyNext();
  });
}

function copy(
  src: string,
  dest: string,
  callback: (error: NodeJS.ErrnoException) => void,
): void {
  const destDir = path.dirname(dest);
  fs.mkdir(destDir, {recursive: true}, (err?) => {
    if (err) {
      callback(err);
      return;
    }
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', callback);
  });
}

export default saveAssets;
