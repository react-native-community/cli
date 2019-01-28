/**
 * @flow
 */

import path from 'path';

import findPlugins from './findPlugins';
import logger from '../util/logger';
import type { CommandT, ProjectCommandT, LocalCommandT } from './types.flow';

/**
 * List of built-in commands
 */
const loadLocalCommands = (): Array<LocalCommandT> => [
  require('../server/server').default,
  require('../runIOS/runIOS').default,
  require('../runAndroid/runAndroid').default,
  require('../library/library').default,
  require('../bundle/bundle').default,
  require('../bundle/ramBundle').default,
  require('../eject/eject').default,
  require('../link/link').default,
  require('../link/unlink').default,
  require('../install/install').default,
  require('../install/uninstall').default,
  require('../upgrade/upgrade').default,
  require('../logAndroid/logAndroid').default,
  require('../logIOS/logIOS').default,
  require('../dependencies/dependencies').default,
  require('../info/info').default,
];

/**
 * Returns an array of commands that are defined in the project.
 *
 * This checks all CLI plugins for presence of 3rd party packages that define commands
 * and loads them
 */
const loadProjectCommands = (root: string): Array<ProjectCommandT> => {
  const plugins = findPlugins(root);

  return plugins.commands.reduce((acc: Array<CommandT>, pathToCommands) => {
    /**
     * `pathToCommand` is a path to a file where commands are defined, relative to `node_modules`
     * folder.
     *
     * Following code gets the name of the package name out of the path, taking scope
     * into consideration.
     */
    const name =
      pathToCommands[0] === '@'
        ? pathToCommands
            .split(path.sep)
            .slice(0, 2)
            .join(path.sep)
        : pathToCommands.split(path.sep)[0];

    // $FlowFixMe: Non-literal require
    const pkg = require(path.join(root, 'node_modules', name, 'package.json'));

    // $FlowFixMe: Non-literal require
    const requiredCommands:
      | ProjectCommandT
      | Array<ProjectCommandT> = require(path.join(
      root,
      'node_modules',
      pathToCommands
    ));

    if (Array.isArray(requiredCommands)) {
      return acc.concat(
        requiredCommands.map(requiredCommand => ({ ...requiredCommand, pkg }))
      );
    }

    return acc.concat({ ...requiredCommands });
  }, []);
};

/**
 * Loads all the commands inside a given `root` folder
 */
export default (root: string): Array<CommandT> => [
  ...loadLocalCommands(),
  {
    name: 'init',
    func: () => {
      logger.warn(
        [
          'Looks like a React Native project already exists in the current',
          'folder. Run this command from a different folder or remove node_modules/react-native',
        ].join('\n')
      );
    },
  },
  ...loadProjectCommands(root),
];
