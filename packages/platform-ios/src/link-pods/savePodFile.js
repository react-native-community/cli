/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';

export default function savePodFile(podfilePath, podLines) {
  const newPodfile = podLines.join('\n');
  logger.debug(`Writing changes to ${podfilePath}`);
  fs.writeFileSync(podfilePath, newPodfile);
}
