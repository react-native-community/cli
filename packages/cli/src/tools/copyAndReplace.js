/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import path from 'path';

// Binary files, don't process these (avoid decoding as utf8)
const binaryExtensions = ['.png', '.jar', '.keystore'];

/**
 * Copy a file to given destination, replacing parts of its contents.
 * @param srcPath Path to a file to be copied.
 * @param destPath Destination path.
 * @param replacements: e.g. {'TextToBeReplaced': 'Replacement'}
 * @param contentChangedCallback
 *        Used when upgrading projects. Based on if file contents would change
 *        when being replaced, allows the caller to specify whether the file
 *        should be replaced or not.
 *        If null, files will be overwritten.
 *        Function(path, 'identical' | 'changed' | 'new') => 'keep' | 'overwrite'
 */
function copyAndReplace(
  srcPath,
  destPath,
  replacements,
  contentChangedCallback,
) {
  if (isDirectory(srcPath)) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    // Not recursive
    return;
  }

  const extension = path.extname(srcPath);
  if (binaryExtensions.indexOf(extension) !== -1) {
    // Binary file
    let shouldOverwrite = 'overwrite';
    if (contentChangedCallback) {
      const newContentBuffer = fs.readFileSync(srcPath);
      let contentChanged = 'identical';
      try {
        const origContentBuffer = fs.readFileSync(destPath);
        if (Buffer.compare(origContentBuffer, newContentBuffer) !== 0) {
          contentChanged = 'changed';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          contentChanged = 'new';
        } else {
          throw err;
        }
      }
      shouldOverwrite = contentChangedCallback(destPath, contentChanged);
    }
    if (shouldOverwrite === 'overwrite') {
      copyBinaryFile(srcPath, destPath, err => {
        if (err) {
          throw err;
        }
      });
    }
  } else {
    // Text file
    const srcPermissions = fs.statSync(srcPath).mode;
    let content = fs.readFileSync(srcPath, 'utf8');
    Object.keys(replacements).forEach(regex => {
      content = content.replace(new RegExp(regex, 'g'), replacements[regex]);
    });

    let shouldOverwrite = 'overwrite';
    if (contentChangedCallback) {
      // Check if contents changed and ask to overwrite
      let contentChanged = 'identical';
      try {
        const origContent = fs.readFileSync(destPath, 'utf8');
        if (content !== origContent) {
          // logger.info('Content changed: ' + destPath);
          contentChanged = 'changed';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          contentChanged = 'new';
        } else {
          throw err;
        }
      }
      shouldOverwrite = contentChangedCallback(destPath, contentChanged);
    }
    if (shouldOverwrite === 'overwrite') {
      fs.writeFileSync(destPath, content, {
        encoding: 'utf8',
        mode: srcPermissions,
      });
    }
  }
}

/**
 * Same as 'cp' on Unix. Don't do any replacements.
 */
function copyBinaryFile(srcPath, destPath, cb) {
  let cbCalled = false;
  const srcPermissions = fs.statSync(srcPath).mode;
  const readStream = fs.createReadStream(srcPath);
  readStream.on('error', err => {
    done(err);
  });
  const writeStream = fs.createWriteStream(destPath, {
    mode: srcPermissions,
  });
  writeStream.on('error', err => {
    done(err);
  });
  writeStream.on('close', () => {
    done();
  });
  readStream.pipe(writeStream);
  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

/**
 * extended directory expectation.
 * npm installs the directory of a local node module as a link to the folder of origin location.
 * such the folder should be allowed to copy and replace as a template
 */
function isDirectory(srcPath) {
  let srcStat = fs.lstatSync(srcPath);

  if (srcStat.isSymbolicLink()) {
    try {
      return fs.readDirSync(srcPath) || false;
    } catch {
      return false;
    }
  }

  return srcStat.isDirectory();
}

export default copyAndReplace;
