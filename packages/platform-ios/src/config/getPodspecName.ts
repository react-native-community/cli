/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import path from 'path';

export default function getPodspecName(podspecFile: string) {
  return path.basename(podspecFile).replace(/\.podspec$/, '');
}
