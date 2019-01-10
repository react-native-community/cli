/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type { ContextT } from '../core/types.flow';

const log = require('npmlog');
const path = require('path');
const { isEmpty, pick } = require('lodash');
const chalk = require('chalk');
const promiseWaterfall = require('./promiseWaterfall');
const getDependencyConfig = require('./getDependencyConfig');
const pollParams = require('./pollParams');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const getProjectConfig = require('./getProjectConfig');

const findReactNativeScripts = require('../util/findReactNativeScripts');

const getPlatforms = require('../core/getPlatforms');

log.heading = 'rnpm-link';

const linkDependency = async (platforms, project, dependency) => {
  const params = await pollParams(dependency.params);

  Object.keys(platforms || {}).forEach(platform => {
    if (!project[platform] || !dependency.config[platform]) {
      return;
    }

    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();
    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.register) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      project[platform],
      dependency.name,
      dependency.config[platform]
    );

    if (isInstalled) {
      log.info(
        chalk.grey(
          `Platform '${platform}' module ${dependency.name} is already linked`
        )
      );
      return;
    }

    log.info(`Linking ${dependency.name} ${platform} dependency`);

    linkConfig.register(
      dependency.name,
      // $FlowFixMe: We check if dependency.config[platform] exists on line 42
      dependency.config[platform],
      params,
      // $FlowFixMe: We check if project[platform] exists on line 42
      project[platform]
    );

    log.info(
      `Platform '${platform}' module ${
        dependency.name
      } has been successfully linked`
    );
  });
};

const linkAssets = (platforms, project, dependency) => {
  if (isEmpty(dependency.assets)) {
    return;
  }

  Object.keys(platforms || {}).forEach(platform => {
    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();

    if (!linkConfig || !linkConfig.copyAssets || !project[platform]) {
      return;
    }

    log.info(`Linking assets to ${platform} project`);
    // $FlowFixMe: We check for existence of project[platform] on line 97.
    linkConfig.copyAssets(dependency.assets, project[platform]);
  });

  log.info('Assets have been successfully linked to your project');
};

type FlagsType = {
  platforms: string,
};

/**
 * Links specified package.
 *
 * @param args [packageName]
 */
function link(args: Array<string>, ctx: ContextT, opts: FlagsType) {
  let platforms;
  let project;
  try {
    platforms = getPlatforms(ctx.root);
    if (opts.platforms) {
      platforms = pick(platforms, opts.platforms);
    }
    project = getProjectConfig(ctx, platforms);
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure this is a React Native project?'
    );
    return Promise.reject(err);
  }
  const hasProjectConfig = Object.keys(platforms).reduce(
    (acc, key) => acc || key in project,
    false
  );
  if (!hasProjectConfig && findReactNativeScripts()) {
    throw new Error(
      '`react-native link <package>` can not be used in Create React Native App projects. ' +
        'If you need to include a library that relies on custom native code, ' +
        'you might have to eject first. ' +
        'See https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md ' +
        'for more information.'
    );
  }

  // Trim the version / tag out of the package name (eg. package@latest)
  const packageName = rawPackageName.replace(/^(.+?)(@.+?)$/gi, '$1');

  const dependencyConfig = getDependencyConfig(ctx, platforms, packageName);

  const tasks = [
    () => promisify(dependencyConfig.commands.prelink || commandStub),
    () => linkDependency(platforms, project, dependencyConfig),
    () => promisify(dependencyConfig.commands.postlink || commandStub),
    () => linkAssets(platforms, project, dependencyConfig),
  ];

  return promiseWaterfall(tasks).catch(err => {
    log.error(
      `Something went wrong while linking. Error: ${err.message} \n` +
        'Please file an issue here: https://github.com/facebook/react-native/issues'
    );
    throw err;
  });
}

module.exports = {
  func: link,
  description: 'links native dependencies for specified package (updates native build files)',
  name: 'link <packageName>',
  options: [
    {
      command: '--platforms [list]',
      description:
        'If you want to link dependencies only for specific platforms',
      parse: (val: string) => val.split(','),
    },
  ],
};
