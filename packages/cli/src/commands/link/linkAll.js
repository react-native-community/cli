// @flow

import {uniqBy, flatten} from 'lodash';
import path from 'path';
import type {
  ContextT,
  PlatformsT,
  ProjectConfigT,
} from '../../tools/types.flow';
import logger from '../../tools/logger';
import getAssets from '../../tools/getAssets';
import getProjectDependencies from './getProjectDependencies';
import getDependencyConfig from './getDependencyConfig';
import promiseWaterfall from './promiseWaterfall';
import commandStub from './commandStub';
import promisify from './promisify';
import linkAssets from './linkAssets';
import linkDependency from './linkDependency';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

function linkAll(
  context: ContextT,
  platforms: PlatformsT,
  project: ProjectConfigT,
) {
  logger.warn(
    'Running `react-native link` without package name is deprecated and will be removed ' +
      'in next release. If you use this command to link your project assets, ' +
      'please let us know about your use case here: https://goo.gl/RKTeoc',
  );

  const projectAssets = getAssets(context.root);
  const dependencies = getProjectDependencies(context.root);
  const depenendenciesConfig = dependencies.map(dependnecy =>
    getDependencyConfig(context, platforms, dependnecy),
  );

  const assets = dedupeAssets(
    depenendenciesConfig.reduce(
      (acc, dependency) => acc.concat(dependency.assets),
      projectAssets,
    ),
  );

  const tasks = flatten(
    depenendenciesConfig.map(config => [
      () => promisify(config.commands.prelink || commandStub),
      () => linkDependency(platforms, project, config),
      () => promisify(config.commands.postlink || commandStub),
      () => linkAssets(platforms, project, assets),
    ]),
  );

  return promiseWaterfall(tasks).catch(err => {
    logger.error(
      `Something went wrong while linking. Error: ${err.message} \n` +
        'Please file an issue here: https://github.com/react-native-community/react-native-cli/issues',
    );
    throw err;
  });
}

export default linkAll;
