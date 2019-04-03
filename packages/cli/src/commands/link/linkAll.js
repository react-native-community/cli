/**
 * @flow
 */

import {uniqBy, flatMap} from 'lodash';
import path from 'path';

import type {ConfigT, PlatformsT} from '../../tools/config/types.flow';
import {CLIError} from '../../tools/errors';

import promiseWaterfall from './promiseWaterfall';
import commandStub from './commandStub';
import promisify from './promisify';

import linkAssets from './linkAssets';
import linkDependency from './linkDependency';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

function linkAll(config: ConfigT, platforms: PlatformsT) {
  const projectAssets = config.assets;

  const assets = dedupeAssets(
    Object.keys(config.dependencies).reduce(
      (acc, dependency) => acc.concat(config.dependencies[dependency].assets),
      projectAssets,
    ),
  );

  const tasks = flatMap(config.dependencies, dependency => [
    () =>
      promisify(config.dependencies[dependency].hooks.prelink || commandStub),
    () =>
      linkDependency(
        config.platforms,
        config.project,
        config.dependencies[dependency],
      ),
    () =>
      promisify(config.dependencies[dependency].hooks.postlink || commandStub),
    () => linkAssets(platforms, config.project, assets),
  ]);

  return promiseWaterfall(tasks).catch(err => {
    throw new CLIError(
      `Something went wrong while linking. Reason: ${err.message}`,
      err,
    );
  });
}

export default linkAll;
