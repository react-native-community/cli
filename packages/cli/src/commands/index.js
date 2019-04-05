/**
 * @flow
 */

import path from 'path';
import type {
  CommandT,
  ProjectCommandT,
  LocalCommandT,
} from '../tools/types.flow';

import {type ContextT} from '../tools/types.flow';
import server from './server/server';
import library from './library/library';
import bundle from './bundle/bundle';
import ramBundle from './bundle/ramBundle';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
import upgrade from './upgrade/upgrade';
import info from './info/info';
import config from './config/config';
import init from './init';

/**
 * List of built-in commands
 */

const loadLocalCommands: Array<LocalCommandT> = [
  server,
  library,
  bundle,
  ramBundle,
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  info,
  config,
  init,
];

/**
 * Returns an array of commands that are defined in the project.
 *
 * This checks all CLI plugins for presence of 3rd party packages that define commands
 * and loads them
 */
const loadProjectCommands = ({
  root,
  commands,
}: ContextT): Array<ProjectCommandT> => {
  return commands.reduce((acc: Array<ProjectCommandT>, cmdPath: string) => {
    /**
     * `pathToCommand` is a path to a file where commands are defined, relative to `node_modules`
     * folder.
     *
     * Following code gets the name of the package name out of the path, taking scope
     * into consideration.
     */
    const name =
      cmdPath[0] === '@'
        ? cmdPath
            .split(path.sep)
            .slice(0, 2)
            .join(path.sep)
        : cmdPath.split(path.sep)[0];

    const pkg = require(path.join(root, 'node_modules', name, 'package.json'));

    const requiredCommands:
      | ProjectCommandT
      | Array<ProjectCommandT> = require(path.join(
      root,
      'node_modules',
      cmdPath,
    ));

    if (Array.isArray(requiredCommands)) {
      return acc.concat(
        requiredCommands.map(requiredCommand => ({...requiredCommand, pkg})),
      );
    }

    return acc.concat({...requiredCommands, pkg});
  }, []);
};

/**
 * Loads all the commands inside a given `root` folder
 */
export function getCommands(ctx: ContextT): Array<CommandT> {
  return [...loadLocalCommands, ...loadProjectCommands(ctx)];
}
