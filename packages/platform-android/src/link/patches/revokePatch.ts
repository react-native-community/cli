/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';

export default function revokePatch(file: string, patch: {patch: string}) {
  if (file) {
    logger.debug(`Patching ${file}`);
  }

  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf8').replace(patch.patch, ''),
  );
}
