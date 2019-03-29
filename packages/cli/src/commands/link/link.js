/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {pick} from 'lodash';
import type {ContextT} from '../../tools/types.flow';

import promiseWaterfall from './promiseWaterfall';
import logger from '../../tools/logger';
import getDependencyConfig from './getDependencyConfig';
import commandStub from './commandStub';
import promisify from './promisify';
import getProjectConfig from './getProjectConfig';
import linkDependency from './linkDependency';
import linkAssets from './linkAssets';
import linkAll from './linkAll';
import getPlatforms, {getPlatformName} from '../../tools/getPlatforms';

type FlagsType = {
  platforms?: Array<string>,
};

/**
 * Updates project and links all dependencies to it.
 *
 * @param args If optional argument [packageName] is provided,
 *             only that package is processed.
 */
function link([rawPackageName]: Array<string>, ctx: ContextT, opts: FlagsType) {
  let platforms;
  let project;
  try {
    platforms = getPlatforms(ctx.root);
    logger.debug(
      'Available platforms: ' +
        `${Object.getOwnPropertyNames(platforms)
          .map(platform => getPlatformName(platform))
          .join(', ')}`,
    );
    if (opts.platforms) {
      platforms = pick(platforms, opts.platforms);
    }
    logger.debug(
      'Targeted platforms: ' +
        `${Object.getOwnPropertyNames(platforms)
          .map(platform => getPlatformName(platform))
          .join(', ')}`,
    );
    project = getProjectConfig(ctx, platforms);
  } catch (err) {
    logger.error(
      'No package found. Are you sure this is a React Native project?',
    );
    return Promise.reject(err);
  }

  if (rawPackageName === undefined) {
    logger.debug(
      'No package name provided, will attemp to link all possible packages.',
    );
    return linkAll(ctx, platforms, project);
  }

  logger.debug(`Package to link: ${rawPackageName}`);

  // Trim the version / tag out of the package name (eg. package@latest)
  const packageName = rawPackageName.replace(/^(.+?)(@.+?)$/gi, '$1');

  const dependencyConfig = getDependencyConfig(ctx, platforms, packageName);

  const tasks = [
    () => promisify(dependencyConfig.commands.prelink || commandStub),
    () => linkDependency(platforms, project, dependencyConfig),
    () => promisify(dependencyConfig.commands.postlink || commandStub),
    () => linkAssets(platforms, project, dependencyConfig.assets),
  ];

  return promiseWaterfall(tasks).catch(err => {
    logger.error(
      `Something went wrong while linking. Error: ${err.message} \n` +
        'Please file an issue here: https://github.com/react-native-community/react-native-cli/issues',
    );
    throw err;
  });
}

export const func = link;

export default {
  func: link,
  description: 'scope link command to certain platforms (comma-separated)',
  name: 'link [packageName]',
  options: [
    {
      command: '--platforms [list]',
      description:
        'If you want to link dependencies only for specific platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};

// link;
