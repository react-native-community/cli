/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {AssetData} from 'metro';
import getAssetDestPath from './getAssetDestPath';

function saveAssetsDefault(
  assets: ReadonlyArray<AssetData>,
  _platform: string,
  _assetsDest: string | undefined,
  _assetCatalogDest: string | undefined,
  addAssetToCopy: (
    asset: AssetData,
    allowedScales: number[] | undefined,
    getAssetDestPath: (asset: AssetData, scale: number) => string,
  ) => void,
) {
  assets.forEach((asset) => addAssetToCopy(asset, undefined, getAssetDestPath));
}

export default saveAssetsDefault;
