/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import makeBuildPatch from './patches/makeBuildPatch';

export default function isInstalled(config, name) {
  const buildGradle = fs.readFileSync(config.buildGradlePath);
  return makeBuildPatch(name).installPattern.test(buildGradle);
}
