/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import readline from 'readline';
import logger from '../../tools/logger';
import hookStdout from '../../tools/hookStdout';

function printWatchModeInstructions() {
  logger.log(
    `\n\nTo reload the app press "r"\nTo open developer menu press "d"`,
  );
}

function enableWatchMode(messageSocket) {
  const {stdin} = process;
  readline.emitKeypressEvents(stdin);

  // We need to set this to true to catch key presses individually.
  // As a result we have to implement our own method for exiting
  // and other commands.
  stdin.setRawMode(true);

  // We have no way of knowing when the dependency graph is done loading
  // except by hooking into stdout itself. We want to print instructions
  // right after its done loading.
  hookStdout(
    output =>
      output.includes('Loading dependency graph, done.') &&
      printWatchModeInstructions(),
  );

  stdin.on('keypress', (key, data) => {
    const {ctrl, name} = data;
    if (ctrl === true && name === 'c') {
      process.exit();
    } else if (name === 'r') {
      messageSocket.broadcast('reload', null);
      logger.info('Reloading app...');
    } else if (name === 'd') {
      messageSocket.broadcast('devMenu', null);
      logger.info('Developer menu opened.');
    }
  });
}

export default enableWatchMode;
