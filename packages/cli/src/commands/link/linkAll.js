/**
 * @flow
 */

import {uniqBy} from 'lodash';
import path from 'path';
import {CLIError, logger} from '@react-native-community/cli-tools';
import type {ConfigT} from 'types';
import linkAssets from './linkAssets';
import linkDependency from './linkDependency';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

type Options = {
  linkDeps?: boolean,
  linkAssets?: boolean,
};

async function linkAll(config: ConfigT, options: Options) {
  try {
    if (options.linkDeps) {
      logger.debug('Linking all dependencies');
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
    }
    if (options.linkAssets) {
      logger.debug('Linking all assets');
      const projectAssets = config.assets;
      const assets = dedupeAssets(
        Object.keys(config.dependencies).reduce(
          (acc, dependency) =>
            acc.concat(config.dependencies[dependency].assets),
          projectAssets,
        ),
      );
      await linkAssets(config.platforms, config.project, assets);
    }
  } catch (error) {
    throw new CLIError(
      `Something went wrong while linking. Reason: ${error.message}`,
      error,
    );
  }
}

export default linkAll;
