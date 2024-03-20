/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import glob from 'fast-glob';
import path from 'path';
import {unixifyPaths} from '@react-native-community/cli-tools';

export default function findManifest(folder: string) {
  let manifestPaths = glob.sync('**/AndroidManifest.xml', {
    cwd: unixifyPaths(folder),
    ignore: [
      'node_modules/**',
      '**/build/**',
      '**/debug/**',
      'Examples/**',
      'examples/**',
      '**/Pods/**',
      '**/sdks/hermes/android/**',
      '**/src/androidTest/**',
      '**/src/test/**',
    ],
  });
  if (manifestPaths.length > 1) {
    // if we have more than one manifest, pick the one in the main folder if present
    const mainManifest = manifestPaths.filter((manifestPath) =>
      manifestPath.includes('src/main/'),
    );
    if (mainManifest.length === 1) {
      manifestPaths = mainManifest;
    }
  }

  return manifestPaths[0] ? path.join(folder, manifestPaths[0]) : null;
}
