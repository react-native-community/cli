/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs-extra';
import path from 'path';
import {logger, groupFilesByType} from '@react-native-community/cli-tools';

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * For now, the only types of files that are handled are:
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 */
export default function copyAssetsAndroid(
  files: Array<string>,
  project: {assetsPath: string},
) {
  const assets = groupFilesByType(files);

  logger.debug(`Assets path: ${project.assetsPath}`);
  (assets.font || []).forEach((asset) => {
    const fontsDir = path.join(project.assetsPath, 'fonts');
    logger.debug(`Copying asset ${asset}`);
    // @todo: replace with fs.mkdirSync(path, {recursive}) + fs.copyFileSync
    // and get rid of fs-extra once we move to Node 10
    fs.copySync(asset, path.join(fontsDir, path.basename(asset)));
  });
}
