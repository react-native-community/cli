/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const android = require('./android');
const Config = require('../util/Config');
const findPlugins = require('./findPlugins');
const findAssets = require('./findAssets');
const ios = require('./ios');
const wrapCommands = require('./wrapCommands');
const { ASSET_REGISTRY_PATH } = require('./Constants');
const findReactNativePath = require('../util/findReactNativePath');

const flatten = require('lodash').flatten;
const minimist = require('minimist');
const path = require('path');

import type { CommandT } from '../commands';

export type ConfigT = {
  /**
   * Returns an object with all platform configurations.
   */
  getPlatformConfig(): Object,
  /**
   * Returns project config from the current working directory
   */
  getProjectConfig(): Object,
  /**
   * Returns dependency config from <node_modules>/packageName
   */
  getDependencyConfig(pkgName: string): Object
};

const getRNPMConfig = folder =>
  // $FlowFixMe non-literal require
  require(path.join(folder, './package.json')).rnpm || {};

const appRoot = process.cwd();

const plugins = findPlugins([appRoot]);

const pluginPlatforms = plugins.platforms.reduce((acc, pathToPlatforms) => {
  return Object.assign(
    acc,
    // $FlowFixMe non-literal require
    require(path.join(appRoot, 'node_modules', pathToPlatforms)),
  );
}, {});

const config: ConfigT = {
  getPlatformConfig(): Object {
    return {
      ios,
      android,
      ...pluginPlatforms,
    };
  },

  getProjectConfig(): Object {
    const platforms = this.getPlatformConfig();
    const folder = process.cwd();
    const rnpm = getRNPMConfig(folder);

    let config = Object.assign({}, rnpm, {
      assets: findAssets(folder, rnpm.assets),
    });

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].projectConfig(folder, rnpm[key] || {});
    });

    return config;
  },

  getDependencyConfig(packageName: string) {
    const platforms = this.getPlatformConfig();
    const folder = path.join(process.cwd(), 'node_modules', packageName);
    const rnpm = getRNPMConfig(folder);

    let config = Object.assign({}, rnpm, {
      assets: findAssets(folder, rnpm.assets),
      commands: wrapCommands(rnpm.commands),
      params: rnpm.params || [],
    });

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].dependencyConfig(folder, rnpm[key] || {});
    });

    return config;
  },
};

module.exports = config;