// @flow

import type { ContextT, PlatformsT, ProjectConfigT } from '../core/types.flow';

const log = require('npmlog');
const { uniqBy, flatten } = require('lodash');
const path = require('path');
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const linkAssets = require('./linkAssets');
const linkDependency = require('./linkDependency');

log.heading = 'rnpm-link';

const dedupeAssets = assets => uniqBy(assets, asset => path.basename(asset));

function linkAll(
  context: ContextT,
  platforms: PlatformsT,
  project: ProjectConfigT
) {
  log.warn(
    'Linking modules without specifying package name is deprecated and will be removed in next release'
  );
  const dependencies = getProjectDependencies(context.root);
  const depenendenciesConfig = dependencies.map(dependnecy =>
    getDependencyConfig(context, platforms, dependnecy)
  );
  const assets = dedupeAssets(flatten(depenendenciesConfig.map(d => d.assets)));

  const tasks = flatten(
    depenendenciesConfig
      .map(config => [
        () => promisify(config.commands.prelink || commandStub),
        () => linkDependency(platforms, project, config),
        () => promisify(config.commands.postlink || commandStub),
      ])
      .concat(() => linkAssets(platforms, project, assets))
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
