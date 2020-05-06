/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import {pick} from 'lodash';
import {logger, CLIError} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import getPlatformName from './getPlatformName';
import linkDependency from './linkDependency';
import linkAssets from './linkAssets';
import linkAll from './linkAll';
import makeHook from './makeHook';
import printDeprecationWarning from './printDeprecationWarning';

type FlagsType = {
  platforms?: Array<string>;
  all?: boolean;
};

/**
 * Updates project and links all dependencies to it.
 *
 * @param args If optional argument [packageName] is provided,
 *             only that package is processed.
 */
async function link(
  [rawPackageName]: Array<string>,
  ctx: Config,
  opts: FlagsType,
) {
  let platforms = ctx.platforms;
  let project = ctx.project;

  if (opts.platforms) {
    // @ts-ignore
    platforms = pick(platforms, opts.platforms);
    logger.debug('Skipping selected platforms');
  }

  logger.debug(
    'Available platforms: ' +
      `${Object.keys(platforms)
        .map(getPlatformName)
        .join(', ')}`,
  );

  if (rawPackageName === undefined) {
    logger.debug('No package name provided, will link all possible assets.');
    return linkAll(ctx, {linkDeps: opts.all, linkAssets: true});
  }

  printDeprecationWarning('react-native link [packageName]');

  // Trim the version / tag out of the package name (eg. package@latest)
  const packageName = rawPackageName.replace(/^(.+?)(@.+?)$/gi, '$1');

  if (!Object.keys(ctx.dependencies).includes(packageName)) {
    throw new CLIError(`
      Unknown dependency. Make sure that the package you are trying to link is
      already installed in your "node_modules" and present in your "package.json" dependencies.
    `);
  }

  const {[packageName]: dependency} = ctx.dependencies;

  logger.debug(`Package to link: ${rawPackageName}`);

  try {
    if (dependency.hooks.prelink) {
      await makeHook(dependency.hooks.prelink)();
    }
    await linkDependency(platforms, project, dependency);
    if (dependency.hooks.postlink) {
      await makeHook(dependency.hooks.postlink)();
    }
    await linkAssets(platforms, project, dependency.assets);
  } catch (error) {
    throw new CLIError(
      `Linking "${chalk.bold(dependency.name)}" failed.`,
      error,
    );
  }
}

export const func = link;

export default {
  func: link,
  description: 'links assets and optionally native modules',
  name: 'link [packageName]',
  options: [
    {
      name: '--platforms [list]',
      description: 'Scope linking to specified platforms',
      parse: (val: string) => val.toLowerCase().split(','),
    },
    {
      name: '--all [boolean]',
      description: 'Link all native modules and assets',
      parse: (val: string) => val.toLowerCase().split(','),
    },
  ],
};
