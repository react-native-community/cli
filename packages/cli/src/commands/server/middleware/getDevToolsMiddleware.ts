/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import {logger} from '@react-native-community/cli-tools';
import {exec} from 'child_process';
import launchDebugger from '../launchDebugger';

function launchDefaultDebugger(
  host: string | undefined,
  port: number,
  args = '',
) {
  const hostname = host || 'localhost';
  const debuggerURL = `http://${hostname}:${port}/debugger-ui${args}`;
  logger.info('Launching Dev Tools...');
  launchDebugger(debuggerURL);
}

function escapePath(pathname: string) {
  // " Can escape paths with spaces in OS X, Windows, and *nix
  return `"${pathname}"`;
}

type LaunchDevToolsOptions = {
  host?: string;
  port: number;
  watchFolders: Array<string>;
};

function launchDevTools(
  {host, port, watchFolders}: LaunchDevToolsOptions,
  isDebuggerConnected: () => boolean,
) {
  // Explicit config always wins
  const customDebugger = process.env.REACT_DEBUGGER;
  if (customDebugger) {
    startCustomDebugger({watchFolders, customDebugger});
  } else if (!isDebuggerConnected()) {
    // Debugger is not yet open; we need to open a session
    launchDefaultDebugger(host, port);
  }
}

function startCustomDebugger({
  watchFolders,
  customDebugger,
}: {
  watchFolders: Array<string>;
  customDebugger: string;
}) {
  const folders = watchFolders.map(escapePath).join(' ');
  const command = `${customDebugger} ${folders}`;
  logger.info('Starting custom debugger by executing:', command);
  exec(command, function(error) {
    if (error !== null) {
      logger.error('Error while starting custom debugger:', error.stack || '');
    }
  });
}

export default function getDevToolsMiddleware(
  options: LaunchDevToolsOptions,
  isDebuggerConnected: () => boolean,
) {
  return function devToolsMiddleware(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (err?: any) => void,
  ) {
    if (req.url === '/launch-js-devtools') {
      launchDevTools(options, isDebuggerConnected);
      res.end('OK');
    } else {
      next();
    }
  };
}
