/**
 * @flow
 */

import {uniqBy} from 'lodash';
import path from 'path';
import chalk from 'chalk';
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
  if (options.linkDeps) {
    logger.debug('Linking all dependencies');
    logger.info(
      `Linking dependencies using "${chalk.bold(
        'link',
      )}" command is now legacy and likely unnecessary. We encourage you to try ${chalk.bold(
        'autolinking',
      )} that comes with React Native v0.60 default template. Autolinking happens at build time – during CocoaPods install or Gradle install phase. More information: ${chalk.dim.underline(
        'https://github.com/react-native-community/cli/blob/master/docs/autolinking.md',
      )}`,
    );

    for (let key in config.dependencies) {
      const dependency = config.dependencies[key];
      try {
        if (dependency.hooks.prelink) {
          await dependency.hooks.prelink();
        }
        await linkDependency(config.platforms, config.project, dependency);
        if (dependency.hooks.postlink) {
          await dependency.hooks.postlink();
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
      await linkAssets(config.platforms, config.project, assets);
    } catch (error) {
      throw new CLIError('Linking assets failed.', error);
    }
  }
}

export default linkAll;
