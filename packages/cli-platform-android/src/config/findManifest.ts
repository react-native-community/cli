/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fg from 'fast-glob';
import path from 'path';

export default function findManifest(folder: string) {
  const manifestPath = fg.sync(path.join('**', 'AndroidManifest.xml'), {
    cwd: folder,
    ignore: [
      'node_modules/**',
      '**/build/**',
      '**/debug/**',
      'Examples/**',
      'examples/**',
      '**/Pods/**',
      '**/sdks/hermes/android/**',
    ],
  })[0];

  return manifestPath ? path.join(folder, manifestPath) : null;
}
