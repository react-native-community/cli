/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';

export default function readPodfile(podfilePath: string) {
  logger.debug(`Reading ${podfilePath}`);
  const podContent = fs.readFileSync(podfilePath, 'utf8');
  return podContent.split(/\r?\n/g);
}
