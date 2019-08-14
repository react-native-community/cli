/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import {logger} from '@react-native-community/cli-tools';
import {exec} from 'child_process';
import launchDebugger from '../launchDebugger';

function launchDefaultDebugger(port, args = '') {
  const debuggerURL = `http://localhost:${port}/debugger-ui${args}`;
  logger.info('Launching Dev Tools...');
  launchDebugger(debuggerURL);
}

function escapePath(pathname) {
  // " Can escape paths with spaces in OS X, Windows, and *nix
  return `"${pathname}"`;
}

function launchDevTools({port, watchFolders}, isDebuggerConnected) {
  // Explicit config always wins
  const customDebugger = process.env.REACT_DEBUGGER;
  if (customDebugger) {
    startCustomDebugger({watchFolders, customDebugger});
  } else if (!isDebuggerConnected()) {
    // Debugger is not yet open; we need to open a session
    launchDefaultDebugger(port);
  }
}

function startCustomDebugger({watchFolders, customDebugger}) {
  const folders = watchFolders.map(escapePath).join(' ');
  const command = `${customDebugger} ${folders}`;
  logger.info('Starting custom debugger by executing:', command);
  exec(command, function(error, stdout, stderr) {
    if (error !== null) {
      logger.error('Error while starting custom debugger:', error);
    }
  });
}

export default function getDevToolsMiddleware(options, isDebuggerConnected) {
  return function devToolsMiddleware(req, res, next) {
    if (req.url === '/launch-js-devtools') {
      launchDevTools(options, isDebuggerConnected);
      res.end('OK');
    } else {
      next();
    }
  };
}
