/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import mapHeaderSearchPaths from './mapHeaderSearchPaths';
import {logger} from '@react-native-community/cli-tools';

export default function addToHeaderSearchPaths(project: any, path: string) {
  logger.debug(`Adding ${path} to header search paths`);
  mapHeaderSearchPaths(project, searchPaths => searchPaths.concat(path));
}
