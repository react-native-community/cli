// @flow

import type { ContextT, PlatformsT, ProjectConfigT } from '../core/types.flow';

const { uniqBy, flatten } = require('lodash');
const path = require('path');
const log = require('../util/logger');
const getAssets = require('../core/getAssets');
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const linkAssets = require('./linkAssets');
const linkDependency = require('./linkDependency');

const dedupeAssets = assets => uniqBy(assets, asset => path.basename(asset));

function linkAll(
  context: ContextT,
  platforms: PlatformsT,
  project: ProjectConfigT
) {
  log.warn(
    'Running `react-native link` without package name is deprecated and will be removed ' +
      'in next release. If you use this command to link your project assets, ' +
      'please let us know about your use case here: https://goo.gl/RKTeoc'
  );

  const projectAssets = getAssets(context.root);
  const dependencies = getProjectDependencies(context.root);
  const depenendenciesConfig = dependencies.map(dependnecy =>
    getDependencyConfig(context, platforms, dependnecy)
  );

  const assets = dedupeAssets(
    depenendenciesConfig.reduce(
      (acc, dependency) => acc.concat(dependency.assets),
      projectAssets
    )
  );

  const tasks = flatten(
    depenendenciesConfig.map(config => [
      () => promisify(config.commands.prelink || commandStub),
      () => linkDependency(platforms, project, config),
      () => promisify(config.commands.postlink || commandStub),
      () => linkAssets(platforms, project, assets),
    ])
  );

  return promiseWaterfall(tasks).catch(err => {
    log.error(
      `Something went wrong while linking. Error: ${err.message} \n` +
        'Please file an issue here: https://github.com/facebook/react-native/issues'
    );
    throw err;
  });
}

module.exports = linkAll;
