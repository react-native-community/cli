/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import glob from 'glob';
import path from 'path';

export default function getPackageClassName(folder: string) {
  const files = glob.sync('**/+(*.java|*.kt)', {cwd: folder});

  const packages = files
    .map((filePath) => fs.readFileSync(path.join(folder, filePath), 'utf8'))
    .map(matchClassName)
    .filter((match) => match);

  // @ts-ignore
  return packages.length ? packages[0][1] : null;
}

export function matchClassName(file: string) {
  const nativeModuleMatch = file.match(
    /class\s+(\w+[^(\s]*)[\s\w():]*(\s+implements\s+|:)[\s\w():,]*[^{]*ReactPackage/,
  );
  // We first check for implementation of ReactPackage to find native
  // modules and then for subclasses of TurboReactPackage to find turbo modules.
  if (nativeModuleMatch) {
    return nativeModuleMatch;
  } else {
    return file.match(
      /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*TurboReactPackage/,
    );
  }
}
