/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import path from 'path';

export default function findAndroidAppFolder(folder: string) {
  const flat = 'android';
  const nested = path.join('android', 'app');

  if (fs.existsSync(path.join(folder, nested))) {
    return nested;
  }

  if (fs.existsSync(path.join(folder, flat))) {
    return flat;
  }

  return null;
}
