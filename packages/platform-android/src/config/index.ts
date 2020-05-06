/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import fs from 'fs';
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

/**
 * Gets android project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
export function projectConfig(
  root: string,
  userConfig: AndroidProjectParams = {},
): AndroidProjectConfig | null {
  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);
  const appName = getAppName(sourceDir, userConfig.appName);
  const isFlat = sourceDir.indexOf('app') === -1;
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

  const packageFolder =
    userConfig.packageFolder || packageName.replace(/\./g, path.sep);

  const mainFilePath = path.join(
    sourceDir,
    userConfig.mainFilePath ||
      path.join(appName, `src/main/java/${packageFolder}/MainApplication.java`),
  );

  const stringsPath = path.join(
    sourceDir,
    userConfig.stringsPath ||
      path.join(appName, '/src/main/res/values/strings.xml'),
  );

  const settingsGradlePath = path.join(
    sourceDir,
    userConfig.settingsGradlePath || 'settings.gradle',
  );

  const assetsPath = path.join(
    sourceDir,
    userConfig.assetsPath || path.join(appName, '/src/main/assets'),
  );

  const buildGradlePath = path.join(
    sourceDir,
    userConfig.buildGradlePath || 'build.gradle',
  );

  return {
    sourceDir,
    isFlat,
    folder: root,
    stringsPath,
    manifestPath,
    buildGradlePath,
    settingsGradlePath,
    assetsPath,
    mainFilePath,
    packageName,
    packageFolder,
    appName,
  };
}

function getAppName(sourceDir: string, userConfigAppName: string | undefined) {
  let appName = '';
  if (
    typeof userConfigAppName === 'string' &&
    fs.existsSync(path.join(sourceDir, userConfigAppName))
  ) {
    appName = userConfigAppName;
  } else if (fs.existsSync(path.join(sourceDir, 'app'))) {
    appName = 'app';
  }
  return appName;
}

/**
 * Same as projectConfigAndroid except it returns
 * different config that applies to packages only
 */
export function dependencyConfig(
  root: string,
  userConfig: AndroidDependencyParams = {},
) {
  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);
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

  return {sourceDir, folder: root, packageImportPath, packageInstance};
}
