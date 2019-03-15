/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import path from 'path';
import groupFilesByType from '../groupFilesByType';
import logger from '../../../tools/logger';

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * For now, the only types of files that are handled are:
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 */
export default function unlinkAssetsAndroid(files, project) {
  const assets = groupFilesByType(files);

  (assets.font || []).forEach(file => {
    const filePath = path.join(
      project.assetsPath,
      'fonts',
      path.basename(file),
    );
    if (fs.existsSync(filePath)) {
      logger.debug(
        `Removing asset ${file} from ${path.join(project.assetsPath, 'fonts')}`,
      );
      fs.unlinkSync(filePath);
    }
  });
}
