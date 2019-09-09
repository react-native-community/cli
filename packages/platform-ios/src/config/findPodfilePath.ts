/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import path from 'path';

export default function findPodfilePath(projectFolder: string) {
  const podFilePath = path.join(projectFolder, '..', 'Podfile');
  const podFileExists = fs.existsSync(podFilePath);

  return podFileExists ? podFilePath : null;
}
