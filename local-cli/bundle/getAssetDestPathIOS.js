/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// TODO: Get this type somehow
import type { PackagerAsset } from '../../Libraries/Image/AssetRegistry';

('use strict');

const path = require('path');

function getAssetDestPathIOS(asset: PackagerAsset, scale: number): string {
  const suffix = scale === 1 ? '' : `@${scale}x`;
  const fileName = `${asset.name + suffix}.${asset.type}`;
  return path.join(asset.httpServerLocation.substr(1), fileName);
}

module.exports = getAssetDestPathIOS;
