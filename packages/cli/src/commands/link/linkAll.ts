import {uniqBy} from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import linkAssets from './linkAssets';
import linkDependency from './linkDependency';
import makeHook from './makeHook';
import printDeprecationWarning from './printDeprecationWarning';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

type Options = {
  linkDeps?: boolean;
  linkAssets?: boolean;
};

async function linkAll(config: Config, options: Options) {
  if (options.linkDeps) {
    printDeprecationWarning('react-native link --all');
    logger.debug('Linking all dependencies');

    for (let key in config.dependencies) {
      const dependency = config.dependencies[key];
      try {
        if (dependency.hooks.prelink) {
          await makeHook(dependency.hooks.prelink)();
        }
        await linkDependency(config.platforms, config.project, dependency);
        if (dependency.hooks.postlink) {
          await makeHook(dependency.hooks.postlink)();
        }
      } catch (error) {
        throw new CLIError(
          `Linking "${chalk.bold(dependency.name)}" failed.`,
          error,
        );
      }
    }
  }
  if (options.linkAssets) {
    logger.debug('Linking all assets');
    const projectAssets = config.assets;
    const assets = dedupeAssets(
      Object.keys(config.dependencies).reduce(
        (acc, dependency) => acc.concat(config.dependencies[dependency].assets),
        projectAssets,
      ),
    );
    try {
      linkAssets(config.platforms, config.project, assets);
    } catch (error) {
      throw new CLIError('Linking assets failed.', error);
    }
  }
}

export default linkAll;
