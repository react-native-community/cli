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
import {
  cleanAssetCatalog,
  getImageSet,
  isCatalogAsset,
  writeImageSet,
} from './assetCatalogIOS';
import filterPlatformAssetScales from './filterPlatformAssetScales';
import getAssetDestPath from './getAssetDestPath';

const ALLOWED_SCALES = [1, 2, 3];

function saveAssetsIOS(
  assets: ReadonlyArray<AssetData>,
  _platform: string,
  _assetsDest: string | undefined,
  assetCatalogDest: string | undefined,
  addAssetToCopy: (
    asset: AssetData,
    allowedScales: number[] | undefined,
    getAssetDestPath: (asset: AssetData, scale: number) => string,
  ) => void,
) {
  if (assetCatalogDest != null) {
    // Use iOS Asset Catalog for images. This will allow Apple app thinning to
    // remove unused scales from the optimized bundle.
    const catalogDir = path.join(assetCatalogDest, 'RNAssets.xcassets');
    if (!fs.existsSync(catalogDir)) {
      logger.error(
        `Could not find asset catalog 'RNAssets.xcassets' in ${assetCatalogDest}. Make sure to create it if it does not exist.`,
      );
      return;
    }

    logger.info('Adding images to asset catalog', catalogDir);
    cleanAssetCatalog(catalogDir);
    for (const asset of assets) {
      if (isCatalogAsset(asset)) {
        const imageSet = getImageSet(
          catalogDir,
          asset,
          filterPlatformAssetScales(ALLOWED_SCALES, asset.scales),
        );
        writeImageSet(imageSet);
      } else {
        addAssetToCopy(asset, ALLOWED_SCALES, getAssetDestPath);
      }
    }
    logger.info('Done adding images to asset catalog');
  } else {
    assets.forEach((asset) =>
      addAssetToCopy(asset, ALLOWED_SCALES, getAssetDestPath),
    );
  }
}

export default saveAssetsIOS;
