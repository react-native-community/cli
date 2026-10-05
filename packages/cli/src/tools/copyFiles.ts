/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import walk from './walk';

const copyBinaryFile = promisify(fs.copyFile);

type Options = {
  exclude?: Array<RegExp>;
};

/**
 * Copy files (binary included) recursively.
 */
async function copyFiles(
  srcPath: string,
  destPath: string,
  options: Options = {},
) {
  const files = walk(
    srcPath,
    (filePath) =>
      options.exclude?.some((p) => filePath.search(p) !== -1) ?? false,
  );
  return Promise.all(
    files.map(async (absoluteSrcFilePath: string) => {
      const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
      await copyFile(
        absoluteSrcFilePath,
        path.resolve(destPath, relativeFilePath),
      );
    }),
  );
}

/**
 * Copy a file to given destination.
 */
async function copyFile(srcPath: string, destPath: string) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    // Not recursive
    return;
  }

  await copyBinaryFile(srcPath, destPath);
  return destPath;
}

export default copyFiles;
