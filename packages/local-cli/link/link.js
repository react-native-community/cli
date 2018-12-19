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
const { flatten, isEmpty, uniqBy } = require('lodash');
const chalk = require('chalk');
const promiseWaterfall = require('./promiseWaterfall');
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const pollParams = require('./pollParams');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const getProjectConfig = require('./getProjectConfig');

const findReactNativeScripts = require('../util/findReactNativeScripts');

const getAssets = require('../core/getAssets');
const getPlatforms = require('../core/getPlatforms');

log.heading = 'rnpm-link';

const dedupeAssets = assets => uniqBy(assets, asset => path.basename(asset));

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

const linkAssets = (platforms, project, assets) => {
  if (isEmpty(assets)) {
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
    linkConfig.copyAssets(assets, project[platform]);
  });

  log.info('Assets have been successfully linked to your project');
};

/**
 * Updates project and links all dependencies to it.
 *
 * @param args If optional argument [packageName] is provided,
 *             only that package is processed.
 */
function link(args: Array<string>, ctx: ContextT) {
  let platforms;
  let project;
  try {
    platforms = getPlatforms(ctx.root);
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
      '`react-native link` can not be used in Create React Native App projects. ' +
        'If you need to include a library that relies on custom native code, ' +
        'you might have to eject first. ' +
        'See https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md ' +
        'for more information.'
    );
  }

  let packageName = args[0];
  // Trim the version / tag out of the package name (eg. package@latest)
  if (packageName !== undefined) {
    packageName = packageName.replace(/^(.+?)(@.+?)$/gi, '$1');
  }

  /*
   * @todo(grabbou): Deprecate `getProjectDependencies()` soon. The implicit
   * behaviour is causing us more harm.
   */
  const dependencies = getDependencyConfig(
    ctx,
    platforms,
    packageName ? [packageName] : getProjectDependencies(ctx.root)
  );

  const assets = dedupeAssets(
    dependencies.reduce(
      (acc, dependency) => acc.concat(dependency.assets),
      getAssets(ctx.root)
    )
  );

  const tasks = flatten(
    dependencies.map(dependency => [
      () => promisify(dependency.commands.prelink || commandStub),
      () => linkDependency(platforms, project, dependency),
      () => promisify(dependency.commands.postlink || commandStub),
    ])
  );

  tasks.push(() => linkAssets(platforms, project, assets));

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
  description: 'links all native dependencies (updates native build files)',
  name: 'link [packageName]',
};
