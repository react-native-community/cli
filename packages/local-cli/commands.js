/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const findPlugins = require('./core/findPlugins');
const path = require('path');
const flatten = require('lodash').flatten;

/**
 * Type of a single React Native CLI command
 */
type LocalCommandT = {
  name: string,
  description?: string,
  usage?: string,
  func: (argv: Array<string>, args: Object) =>?Promise<void>,
  options?: Array<{
    command: string,
    description?: string,
    parse?: (val: string) => any,
    default?: (() => mixed) | mixed,
  }>,
  examples?: Array<{
    desc: string,
    cmd: string,
  }>,
};

type Package = {
  version: string,
  name: string,
};

/**
 * User can define command either as an object (RequiredCommandT) or
 * as an array of commands (Array<RequiredCommandT>). 
 */
type ProjectCommandT = LocalCommandT & {
  pkg: Package
};

/**
 * Main type. Can be either local or a project command.
 */
export type CommandT = LocalCommandT | ProjectCommandT;

/**
 * List of built-in commands
 */
const documentedCommands = [
  require('./server/server'),
  require('./runIOS/runIOS'),
  require('./runAndroid/runAndroid'),
  require('./library/library'),
  require('./bundle/bundle'),
  require('./bundle/ramBundle'),
  require('./eject/eject'),
  require('./link/link'),
  require('./link/unlink'),
  require('./install/install'),
  require('./install/uninstall'),
  require('./upgrade/upgrade'),
  require('./logAndroid/logAndroid'),
  require('./logIOS/logIOS'),
  require('./dependencies/dependencies'),
  require('./info/info'),
];

/**
 * The user should never get here because projects are inited by
 * using `react-native-cli` from outside a project directory.
 */
const undocumentedCommands = [
  {
    name: 'init',
    func: () => {
      console.log(
        [
          'Looks like React Native project already exists in the current',
          'folder. Run this command from a different folder or remove node_modules/react-native',
        ].join('\n'),
      );
    },
  },
];

/**
 * Returns an array of commands that are defined in the project.  
 * 
 * This checks all CLI plugins for presence of 3rd party packages that define commands
 * and loads them
 */
const getProjectCommands = (appRoot: string): Array<ProjectCommandT> => {
  const plugins = findPlugins([appRoot]);

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
    const pkg = require(path.join(appRoot, 'node_modules', name, 'package.json'));

    // $FlowFixMe: Non-literal require
    let requiredCommands: (ProjectCommandT | Array<ProjectCommandT>) = require(
      path.join(appRoot, 'node_modules', pathToCommands)
    );

    if (Array.isArray(requiredCommands)) {
      return acc.concat(requiredCommands.map(requiredCommand => ({ ...requiredCommand, pkg })));
    }

    return acc.concat({ ...requiredCommands });
  }, []);
};

const commands: Array<CommandT> = [
  ...documentedCommands,
  ...undocumentedCommands,
  ...getProjectCommands(process.cwd()),
];

module.exports = commands;
