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
import makeHook from './makeHook';

const dedupeAssets = (assets: Array<string>): Array<string> =>
  uniqBy(assets, asset => path.basename(asset));

type Options = {
  linkDeps?: boolean,
  linkAssets?: boolean,
  checkInstalled?: boolean,
};

async function linkAll(config: ConfigT, options: Options) {
  let deps = [];
  if (options.linkDeps) {
    if (!options.checkInstalled) {
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
    }

    for (let key in config.dependencies) {
      const dependency = config.dependencies[key];
      try {
        if (!options.checkInstalled && dependency.hooks.prelink) {
          await makeHook(dependency.hooks.prelink)();
        }
        const x = await linkDependency(
          config.platforms,
          config.project,
          dependency,
          options.checkInstalled,
        );
        deps = deps.concat(x.filter(d => d && d.isInstalled));
        if (!options.checkInstalled && dependency.hooks.postlink) {
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

  if (options.checkInstalled) {
    const installedModules = [...new Set(deps.map(dep => dep.dependency.name))];
    if (installedModules.length) {
      logger.warn(
        `Following modules are linked using legacy "react-native link": \n${installedModules
          .map(x => `  - ${chalk.bold(x)}`)
          .join(
            '\n',
          )}\nPlease unlink them to not conflict with autolinking. You can do so with "react-native unlink" command. If any module is not compatible with autolinking (it breaks the build phase), please ignore this warning and notify its maintainers about it.`,
      );
    }
    return;
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
