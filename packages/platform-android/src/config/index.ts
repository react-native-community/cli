/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import findAndroidAppFolder from './findAndroidAppFolder';
import findManifest from './findManifest';
import findPackageClassName from './findPackageClassName';
import readManifest from './readManifest';
import {
  AndroidProjectParams,
  AndroidDependencyParams,
} from '@react-native-community/cli-types';
import {XmlDocument} from 'xmldoc';

const getPackageName = (manifest: XmlDocument) => manifest.attr.package;

export function projectConfig(
  folder: string,
  userConfig: AndroidProjectParams = {},
) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);

  const packageName = userConfig.packageName || getPackageName(manifest);

  if (!packageName) {
    throw new Error(`Package name not found in ${manifestPath}`);
  }

  return {
    sourceDir,
    packageName,
  };
}

export function dependencyConfig(
  folder: string,
  userConfig: AndroidDependencyParams = {},
) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);
  const packageName = userConfig.packageName || getPackageName(manifest);
  const packageClassName = findPackageClassName(sourceDir);

  /**
   * This module has no package to export
   */
  if (!packageClassName) {
    return null;
  }

  const packageImportPath =
    userConfig.packageImportPath ||
    `import ${packageName}.${packageClassName};`;

  const packageInstance =
    userConfig.packageInstance || `new ${packageClassName}()`;

  return {sourceDir, packageName, packageImportPath, packageInstance};
}
