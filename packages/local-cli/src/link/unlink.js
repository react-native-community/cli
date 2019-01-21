/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ContextT } from '../core/types.flow';

const log = require('npmlog');

const { flatten, isEmpty, difference } = require('lodash');
const getProjectConfig = require('./getProjectConfig');
const getDependencyConfig = require('./getDependencyConfig');
const getProjectDependencies = require('./getProjectDependencies');
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');

const getPlatforms = require('../core/getPlatforms');

log.heading = 'rnpm-link';

const unlinkDependency = (
  platforms,
  project,
  dependency,
  packageName,
  otherDependencies
) => {
  Object.keys(platforms || {}).forEach(platform => {
    if (!project[platform] || !dependency.config[platform]) {
      return;
    }

    const linkConfig =
      platforms[platform] &&
      platforms[platform].linkConfig &&
      platforms[platform].linkConfig();
    if (!linkConfig || !linkConfig.isInstalled || !linkConfig.unregister) {
      return;
    }

    const isInstalled = linkConfig.isInstalled(
      project[platform],
      packageName,
      dependency.config[platform]
    );

    if (!isInstalled) {
      log.info(`Platform '${platform}' module ${packageName} is not installed`);
      return;
    }

    log.info(`Unlinking ${packageName} ${platform} dependency`);

    linkConfig.unregister(
      packageName,
      // $FlowFixMe: We check for existence on line 38
      dependency.config[platform],
      // $FlowFixMe: We check for existence on line 38
      project[platform],
      otherDependencies
    );

    log.info(
      `Platform '${platform}' module ${
        dependency.name
      } has been successfully unlinked`
    );
  });
};

/**
 * Updates project and unlink specific dependency
 *
 * If optional argument [packageName] is provided, it's the only one
 * that's checked
 */
function unlink(args: Array<string>, ctx: ContextT) {
  const packageName = args[0];

  let platforms;

  try {
    platforms = getPlatforms(ctx.root);
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      "No package found. Are you sure it's a React Native project?"
    );
    return Promise.reject(err);
  }

  const allDependencies = getProjectDependencies().map(dependency =>
    getDependencyConfig(ctx, platforms, dependency)
  );
  let otherDependencies;
  let dependency;

  try {
    const idx = allDependencies.findIndex(p => p.name === packageName);

    if (idx === -1) {
      throw new Error(`Project ${packageName} is not a react-native library`);
    }

    otherDependencies = [...allDependencies];
    dependency = otherDependencies.splice(idx, 1)[0]; // eslint-disable-line prefer-destructuring
  } catch (err) {
    log.warn('ERRINVALIDPROJ', err.message);
    return Promise.reject(err);
  }

  const project = getProjectConfig(ctx, platforms);

  const tasks = [
    () => promisify(dependency.commands.preunlink || commandStub),
    () =>
      unlinkDependency(
        platforms,
        project,
        dependency,
        packageName,
        otherDependencies
      ),
    () => promisify(dependency.commands.postunlink || commandStub),
  ];

  return promiseWaterfall(tasks)
    .then(() => {
      // @todo move all these to `tasks` array, just like in
      // link
      const assets = difference(
        dependency.assets,
        flatten(allDependencies, d => d.assets)
      );

      if (isEmpty(assets)) {
        return;
      }

      Object.keys(platforms || {}).forEach(platform => {
        const linkConfig =
          platforms[platform] &&
          platforms[platform].linkConfig &&
          platforms[platform].linkConfig();
        if (!linkConfig || !linkConfig.unlinkAssets || !project[platform]) {
          return;
        }

        log.info(`Unlinking assets from ${platform} project`);
        // $FlowFixMe: We check for platorm existence on line 150
        linkConfig.unlinkAssets(assets, project[platform]);
      });

      log.info(
        `${packageName} assets has been successfully unlinked from your project`
      );
    })
    .catch(err => {
      log.error(
        `It seems something went wrong while unlinking. Error: ${err.message}`
      );
      throw err;
    });
}

module.exports = {
  func: unlink,
  description: 'unlink native dependency',
  name: 'unlink <packageName>',
};
