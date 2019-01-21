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
const { pick } = require('lodash');
const promiseWaterfall = require('./promiseWaterfall');
const getDependencyConfig = require('./getDependencyConfig');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const getProjectConfig = require('./getProjectConfig');
const linkDependency = require('./linkDependency');
const linkAssets = require('./linkAssets');
const linkAll = require('./linkAll');

const findReactNativeScripts = require('../util/findReactNativeScripts');

const getPlatforms = require('../core/getPlatforms');

log.heading = 'rnpm-link';

type FlagsType = {
  platforms: Array<string>,
};

/**
 * Updates project and links all dependencies to it.
 *
 * @param args If optional argument [packageName] is provided,
 *             only that package is processed.
 */
function link([rawPackageName]: Array<string>, ctx: ContextT, opts: FlagsType) {
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
      '`react-native link [package]` can not be used in Create React Native App projects. ' +
        'If you need to include a library that relies on custom native code, ' +
        'you might have to eject first. ' +
        'See https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md ' +
        'for more information.'
    );
  }

  if (rawPackageName === undefined) {
    return linkAll(ctx, platforms, project);
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
  description: 'scope link command to certain platforms (comma-separated)',
  name: 'link [packageName]',
  options: [
    {
      command: '--platforms [list]',
      description:
        'If you want to link dependencies only for specific platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};
