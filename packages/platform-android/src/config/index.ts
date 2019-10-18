/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import findAndroidDir from './findAndroidDir';
import findManifest from './findManifest';
import findPackageClassName from './findPackageClassName';
import readManifest from './readManifest';
import {
  AndroidProjectParams,
  AndroidDependencyParams,
  AndroidProjectConfig,
} from '@react-native-community/cli-types';
import {XmlDocument} from 'xmldoc';

const getPackageName = (manifest: XmlDocument) => manifest.attr.package;

export function projectConfig(
  root: string,
  userConfig: AndroidProjectParams = {},
): AndroidProjectConfig | null {
  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);
  const appName = userConfig.appName || 'app';
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(path.join(sourceDir, appName));

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
    appName,
    packageName,
    manifestPath,
  };
}

export function dependencyConfig(
  root: string,
  userConfig: AndroidDependencyParams = {},
) {
  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);
  const appName = userConfig.appName || 'app';
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(path.join(sourceDir, appName));

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

  return {sourceDir, appName, packageName, packageImportPath, packageInstance};
}
