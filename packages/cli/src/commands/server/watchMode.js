/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import readline from 'readline';

function enableWatchMode(messageSocket) {
  readline.emitKeypressEvents(process.stdin);

  // We need to set this to true to catch key presses individually.
  // As a result we have to implement our own method for exiting
  // and other commands.
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (key, data) => {
    if (data.ctrl === true && data.name === 'c') {
      process.exit();
    } else if (data.name === 'r') {
      // reload app if r is pressed
      messageSocket.broadcast('reload', null);
    }
  });
}

export default enableWatchMode;
