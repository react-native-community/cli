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
async function copyFiles(srcPath: string, destPath: string) {
  return Promise.all(
    walk(srcPath).map(async absoluteSrcFilePath => {
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
function copyFile(srcPath: string, destPath: string) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    // Not recursive
    return;
  }

  return new Promise((resolve, reject) => {
    copyBinaryFile(srcPath, destPath, err => {
      if (err) {
        reject(err);
      }
      resolve(destPath);
    });
  });
}

/**
 * Same as 'cp' on Unix. Don't do any replacements.
 */
function copyBinaryFile(srcPath, destPath, cb) {
  let cbCalled = false;
  const {mode} = fs.statSync(srcPath);
  const readStream = fs.createReadStream(srcPath);
  const writeStream = fs.createWriteStream(destPath);
  readStream.on('error', err => {
    done(err);
  });
  writeStream.on('error', err => {
    done(err);
  });
  readStream.on('close', () => {
    done();
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
