/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Given an array of xcodeproj libraries and pbxFile,
 * it appends it to that group
 *
 * Important: That function mutates `libraries` and it's not pure.
 * It's mainly due to limitations of `xcode` library.
 */
module.exports = function addProjectToLibraries(libraries, file) {
  return libraries.children.push({
    value: file.fileRef,
    comment: file.basename,
  });
};
