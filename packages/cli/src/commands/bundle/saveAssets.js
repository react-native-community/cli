/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';

import filterPlatformAssetScales from './filterPlatformAssetScales';
import getAssetDestPathAndroid from './getAssetDestPathAndroid';
import getAssetDestPathIOS from './getAssetDestPathIOS';
import {logger} from '@react-native-community/cli-tools';

function saveAssets(assets, platform, assetsDest) {
  if (!assetsDest) {
    logger.warn('Assets destination folder is not set, skipping...');
    return Promise.resolve();
  }

  const getAssetDestPath =
    platform === 'android' ? getAssetDestPathAndroid : getAssetDestPathIOS;

  const filesToCopy = Object.create(null); // Map src -> dest
  assets.forEach(asset => {
    const validScales = new Set(
      filterPlatformAssetScales(platform, asset.scales),
    );
    asset.scales.forEach((scale, idx) => {
      if (!validScales.has(scale)) {
        return;
      }
      const src = asset.files[idx];
      const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
      filesToCopy[src] = dest;
    });
  });

  return copyAll(filesToCopy);
}

function copyAll(filesToCopy) {
  const queue = Object.keys(filesToCopy);
  if (queue.length === 0) {
    return Promise.resolve();
  }

  logger.info(`Copying ${queue.length} asset files`);
  return new Promise((resolve, reject) => {
    const copyNext = error => {
      if (error) {
        reject(error);
        return;
      }
      if (queue.length === 0) {
        logger.info('Done copying assets');
        resolve();
      } else {
        const src = queue.shift();
        const dest = filesToCopy[src];
        copy(src, dest, copyNext);
      }
    };
    copyNext();
  });
}

function copy(src, dest, callback) {
  const destDir = path.dirname(dest);
  mkdirp(destDir, err => {
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
