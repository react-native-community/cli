/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import mapHeaderSearchPaths from './mapHeaderSearchPaths';
import logger from '../../../tools/logger';

export default function addToHeaderSearchPaths(project, path) {
  logger.debug(`Adding ${path} to header search paths`);
  mapHeaderSearchPaths(project, searchPaths => searchPaths.concat(path));
}
