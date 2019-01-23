/**
 * @flow
 */

import type { CommandT, ProjectCommandT, LocalCommandT } from './types.flow';

const path = require('path');
const findPlugins = require('./findPlugins');
const logger = require('../util/logger');

/**
 * List of built-in commands
 */
const loadLocalCommands = (): Array<LocalCommandT> => [
  require('../server/server'),
  require('../runIOS/runIOS'),
  require('../runAndroid/runAndroid'),
  require('../library/library'),
  require('../bundle/bundle'),
  require('../bundle/ramBundle'),
  require('../eject/eject'),
  require('../link/link'),
  require('../link/unlink'),
  require('../install/install'),
  require('../install/uninstall'),
  require('../upgrade/upgrade'),
  require('../logAndroid/logAndroid'),
  require('../logIOS/logIOS'),
  require('../dependencies/dependencies'),
  require('../info/info'),
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
module.exports = (root: string): Array<CommandT> => [
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
