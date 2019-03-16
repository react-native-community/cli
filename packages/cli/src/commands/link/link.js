/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ContextT} from '../../tools/types.flow';
import type {LinkOptions} from './types.flow';
import promiseWaterfall from './promiseWaterfall';
import logger from '../../tools/logger';
import getDependencyConfig from './getDependencyConfig';
import commandStub from './commandStub';
import promisify from './promisify';
import linkDependency from './linkDependency';
import {linkAssets} from './linkAssets';
import {ReactNativeNotFound} from '../../tools/errors';
import getPlatformsAndProject from './getPlatformsAndProject';

/**
 *
 * @param args [packageName] - links native dependencies and assets for provided package
 */
function link(
  [rawPackageName]: Array<string>,
  ctx: ContextT,
  opts: LinkOptions,
) {
  logger.debug(`Package to link: ${rawPackageName}`);

  let platforms;
  let project;
  try {
    let config = getPlatformsAndProject(ctx, opts);

    platforms = config.platforms;
    project = config.project;
  } catch (err) {
    throw new ReactNativeNotFound(err);
  }
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
  name: 'link <packageName>',
  options: [
    {
      command: '--platforms [list]',
      description:
        'If you want to link dependencies only for specific platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};
