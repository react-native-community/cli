/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import fs from 'fs';
import glob from 'tinyglobby';
import path from 'path';
import {unixifyPaths} from '@react-native-community/cli-tools';

export function getMainActivityFiles(
  folder: string,
  includePackage: boolean = true,
) {
  let patternArray = [];

  if (includePackage) {
    patternArray.push('Package.java', 'Package.kt');
  } else {
    patternArray.push('.java', '.kt');
  }

  return glob.globSync(`**/*{${patternArray.join(',')}}`, {
    cwd: unixifyPaths(folder),
    expandDirectories: false,
    ignore: ['**/.cxx/**'],
  });
}

export default function getPackageClassName(folder: string) {
  let files = getMainActivityFiles(folder);
  let packages = getClassNameMatches(files, folder);

  if (packages && packages.length > 0 && Array.isArray(packages[0])) {
    return packages[0][1];
  }

  /*
    When module contains `expo-module.config.json` we return null
    because expo modules follow other practices and don't implement
    ReactPackage/TurboReactPackage directly, so it doesn't make sense
    to scan and read hundreds of files to get package class name.

    Exception is `expo` package itself which contains `expo-module.config.json`
    and implements `ReactPackage/TurboReactPackage`.

    Following logic is done due to performance optimization.
  */

  if (fs.existsSync(path.join(folder, '..', 'expo-module.config.json'))) {
    return null;
  }

  files = getMainActivityFiles(folder, false);
  packages = getClassNameMatches(files, folder);

  // @ts-ignore
  return packages.length ? packages[0][1] : null;
}

function getClassNameMatches(files: string[], folder: string) {
  return files
    .map((filePath) => fs.readFileSync(path.join(folder, filePath), 'utf8'))
    .map(matchClassName)
    .filter((match) => match);
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
      /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*(Turbo|Base)ReactPackage/,
    );
  }
}
