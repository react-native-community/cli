/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import glob from 'glob';
import path from 'path';

/**
 * Gets package's class name (class that implements ReactPackage)
 * by searching for its declaration in all Java/Kotlin files present in the folder
 *
 * @param {String} folder Folder to find java/kt files
 */
export default function getPackageClassName(folder) {
  const files = glob.sync('**/+(*.java|*.kt)', {cwd: folder});

  const packages = files
    .map(filePath => fs.readFileSync(path.join(folder, filePath), 'utf8'))
    .map(file => file.match(/class (.*) +(implements|:) ReactPackage/))
    .filter(match => match);

  return packages.length ? packages[0][1] : null;
}
