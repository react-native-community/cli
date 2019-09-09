/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import PbxFile from 'xcode/lib/pbxFile';

/**
 * Given xcodeproj and filePath, it creates new file
 * from path provided, adds it to the project
 * and returns newly created instance of a file
 */
export default function addFileToProject(project: any, filePath: string) {
  const file = new PbxFile(filePath);
  file.uuid = project.generateUuid();
  file.fileRef = project.generateUuid();
  project.addToPbxFileReferenceSection(file);
  return file;
}
