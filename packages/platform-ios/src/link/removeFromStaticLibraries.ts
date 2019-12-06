/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import PbxFile from 'xcode/lib/pbxFile';
import removeFromPbxReferenceProxySection from './removeFromPbxReferenceProxySection';

/**
 * Removes file from static libraries
 *
 * Similar to `node-xcode` addStaticLibrary
 */
export default function removeFromStaticLibraries(
  project: any,
  path: string,
  opts: {[key: string]: any},
) {
  const file = new PbxFile(path);

  file.target = opts ? opts.target : undefined;

  project.removeFromPbxFileReferenceSection(file);
  project.removeFromPbxBuildFileSection(file);
  project.removeFromPbxFrameworksBuildPhase(file);
  project.removeFromLibrarySearchPaths(file);
  removeFromPbxReferenceProxySection(project, file);

  return file;
}
