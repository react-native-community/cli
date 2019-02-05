/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';
import { union, uniq, flatten } from 'lodash';

const RNPM_PLUGIN_PATTERNS = [/^rnpm-plugin-/, /^@(.*)\/rnpm-plugin-/];

const REACT_NATIVE_PLUGIN_PATTERNS = [
  /^react-native-/,
  /^@(.*)\/react-native-/,
  /^@react-native(.*)\/(?!rnpm-plugin-)/,
];

/**
 * Filter dependencies by name pattern
 * @param  {String} dependency Name of the dependency
 * @return {Boolean}           If dependency is a rnpm plugin
 */
const isRNPMPlugin = dependency =>
  RNPM_PLUGIN_PATTERNS.some(pattern => pattern.test(dependency));
const isReactNativePlugin = dependency =>
  REACT_NATIVE_PLUGIN_PATTERNS.some(pattern => pattern.test(dependency));

const readPackage = folder => {
  try {
    return require(path.join(folder, 'package.json'));
  } catch (e) {
    return null;
  }
};

const findPluginsInReactNativePackage = pjson => {
  if (!pjson.rnpm || !pjson.rnpm.plugin) {
    return [];
  }

  return path.join(pjson.name, pjson.rnpm.plugin);
};

const findPlatformsInPackage = pjson => {
  if (!pjson.rnpm || !pjson.rnpm.platform) {
    return [];
  }

  return path.join(pjson.name, pjson.rnpm.platform);
};

const getEmptyPluginConfig = () => ({
  commands: [],
  platforms: [],
  haste: {
    platforms: [],
    providesModuleNodeModules: [],
  },
});

const findHasteConfigInPackageAndConcat = (pjson, haste) => {
  if (!pjson.rnpm || !pjson.rnpm.haste) {
    return;
  }
  const pkgHaste = pjson.rnpm.haste;

  if (pkgHaste.platforms) {
    // eslint-disable-next-line no-param-reassign
    haste.platforms = haste.platforms.concat(pkgHaste.platforms);
  }

  if (pkgHaste.providesModuleNodeModules) {
    // eslint-disable-next-line no-param-reassign
    haste.providesModuleNodeModules = haste.providesModuleNodeModules.concat(
      pkgHaste.providesModuleNodeModules
    );
  }
};

const findPluginsInFolder = folder => {
  const pjson = readPackage(folder);

  if (!pjson) {
    return getEmptyPluginConfig();
  }

  const deps = union(
    Object.keys(pjson.dependencies || {}),
    Object.keys(pjson.devDependencies || {})
  );

  return deps.reduce((acc, pkg) => {
    let { commands, platforms } = acc;
    if (isRNPMPlugin(pkg)) {
      commands = commands.concat(pkg);
    }
    if (isReactNativePlugin(pkg)) {
      const pkgJson = readPackage(path.join(folder, 'node_modules', pkg));
      if (pkgJson) {
        commands = commands.concat(findPluginsInReactNativePackage(pkgJson));
        platforms = platforms.concat(findPlatformsInPackage(pkgJson));
        findHasteConfigInPackageAndConcat(pkgJson, acc.haste);
      }
    }
    return { commands, platforms, haste: acc.haste };
  }, getEmptyPluginConfig());
};

/**
 * Find plugins in package.json of the given folder
 * @param {String} folder Path to the folder to get the package.json from
 */
export default function findPlugins(folder: string) {
  const plugin = findPluginsInFolder(folder);
  return {
    commands: uniq(flatten(plugin.commands)),
    platforms: uniq(flatten(plugin.platforms)),
    haste: {
      platforms: uniq(flatten(plugin.haste.platforms)),
      providesModuleNodeModules: uniq(
        flatten(plugin.haste.providesModuleNodeModules)
      ),
    },
  };
}
