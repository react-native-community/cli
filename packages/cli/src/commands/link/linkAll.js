/**
 * @flow
 */

import {uniqBy} from 'lodash';
import path from 'path';

import type {ConfigT} from '../../../../../types/config';

import linkAssets from './linkAssets';
import linkDependency from './linkDependency';

import {CLIError} from '@react-native-community/cli-tools';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

async function linkAll(config: ConfigT) {
  const projectAssets = config.assets;

  const assets = dedupeAssets(
    Object.keys(config.dependencies).reduce(
      (acc, dependency) => acc.concat(config.dependencies[dependency].assets),
      projectAssets,
    ),
  );

  try {
    Object.keys(config.dependencies).forEach(async key => {
      const dependency = config.dependencies[key];
      if (dependency.hooks.prelink) {
        await dependency.hooks.prelink();
      }
      await linkDependency(config.platforms, config.project, dependency);
      if (dependency.hooks.postlink) {
        await dependency.hooks.postlink();
      }
    });
    await linkAssets(config.platforms, config.project, assets);
  } catch (error) {
    throw new CLIError(
      `Something went wrong while linking. Reason: ${error.message}`,
      error,
    );
  }
}

export default linkAll;
