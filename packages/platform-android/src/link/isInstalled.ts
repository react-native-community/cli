/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import makeBuildPatch from './patches/makeBuildPatch';

export default function isInstalled(
  config: {buildGradlePath: string},
  name: string,
) {
  const buildGradle = fs.readFileSync(config.buildGradlePath, 'utf8');
  return makeBuildPatch(name).installPattern.test(buildGradle);
}
