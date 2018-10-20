/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');

module.exports = function savePodFile(podfilePath, podLines) {
  const newPodfile = podLines.join('\n');
  fs.writeFileSync(podfilePath, newPodfile);
};
