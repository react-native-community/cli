/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import glob from 'glob';
import path from 'path';

export default function findPodspecName(folder) {
  const podspecs = glob.sync('*.podspec', {cwd: folder});
  let podspecFile = null;
  if (podspecs.length === 0) {
    return null;
  }
  if (podspecs.length === 1) {
    podspecFile = podspecs[0];
  } else {
    const folderParts = folder.split(path.sep);
    const currentFolder = folderParts[folderParts.length - 1];
    const toSelect = podspecs.indexOf(`${currentFolder}.podspec`);
    if (toSelect === -1) {
      podspecFile = podspecs[0];
    } else {
      podspecFile = podspecs[toSelect];
    }
  }

  return podspecFile.replace('.podspec', '');
}
