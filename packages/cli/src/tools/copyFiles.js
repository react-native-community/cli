/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import fs from 'fs';
import path from 'path';
import walk from './walk';

/**
 * Copy files (binary included) recursively.
 */
function copyFiles(srcPath: string, destPath: string) {
  walk(srcPath).forEach(absoluteSrcFilePath => {
    const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
    copyFile(absoluteSrcFilePath, path.resolve(destPath, relativeFilePath));
  });
}

/**
 * Copy a file to given destination.
 */
function copyFile(srcPath: string, destPath: string) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    // Not recursive
    return;
  }

  copyBinaryFile(srcPath, destPath, err => {
    if (err) {
      throw err;
    }
  });
}

/**
 * Same as 'cp' on Unix. Don't do any replacements.
 */
function copyBinaryFile(srcPath, destPath, cb) {
  let cbCalled = false;
  const {mode} = fs.statSync(srcPath);
  const readStream = fs.createReadStream(srcPath);
  readStream.on('error', err => {
    done(err);
  });
  const writeStream = fs.createWriteStream(destPath);
  writeStream.on('error', err => {
    done(err);
  });
  writeStream.on('close', () => {
    done();
  });
  writeStream.on('ready', () => {
    fs.chmodSync(destPath, mode);
  });
  readStream.pipe(writeStream);
  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

export default copyFiles;
