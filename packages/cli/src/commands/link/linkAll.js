/**
 * @flow
 */

import {uniqBy, flatMap} from 'lodash';
import path from 'path';

import type {ConfigT} from '../../tools/config/types.flow';

import promiseWaterfall from './promiseWaterfall';
import commandStub from './commandStub';
import promisify from './promisify';

import linkAssets from './linkAssets';
import linkDependency from './linkDependency';

import {CLIError} from '@react-native-community/cli-tools';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

function linkAll(config: ConfigT) {
  const projectAssets = config.assets;

  const assets = dedupeAssets(
    Object.keys(config.dependencies).reduce(
      (acc, dependency) => acc.concat(config.dependencies[dependency].assets),
      projectAssets,
    ),
  );

  const tasks = flatMap(
    config.dependencies,
    dependency => [
      () => promisify(dependency.hooks.prelink || commandStub),
      () => linkDependency(config.platforms, config.project, dependency),
      () => promisify(dependency.hooks.postlink || commandStub),
    ],
    () => linkAssets(config.platforms, config.project, assets),
  );

  return promiseWaterfall(tasks).catch(err => {
    throw new CLIError(
      `Something went wrong while linking. Reason: ${err.message}`,
      err,
    );
  });
}

export default linkAll;
