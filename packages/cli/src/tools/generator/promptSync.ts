/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Simplified version of:
// https://github.com/0x00A/prompt-sync/blob/master/index.js

import fs from 'fs';

type Options = {
  echo?: string;
  ask?: string;
  value?: string;
  autocomplete?: string[] | Function;
};

const term = 13; // carriage return

function create() {
  return prompt;

  function prompt(
    ask?: string | Options,
    value?: string | Options,
    opts?: Options,
  ) {
    let insert = 0;
    opts = opts || {};

    if (typeof ask === 'object') {
      opts = ask;
      ask = opts.ask;
    } else if (typeof value === 'object') {
      opts = value;
      value = opts.value;
    }
    ask = ask || '';
    const echo = opts.echo;
    const masked = 'echo' in opts;

    let fd;
    if (process.platform === 'win32') {
      // @ts-ignore
      fd = process.stdin.fd;
    } else {
      fd = fs.openSync('/dev/tty', 'rs');
    }

    const wasRaw = process.stdin.isRaw;
    if (!wasRaw && process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }

    let buf = Buffer.alloc(3);
    let str = '';

    let character;

    let read;

    if (ask) {
      process.stdout.write(ask);
    }

    while (true) {
      read = fs.readSync(fd, buf, 0, 3, null);
      if (read > 1) {
        // received a control sequence
        if (buf.toString()) {
          str += buf.toString();
          str = str.replace(/\0/g, '');
          insert = str.length;
          process.stdout.write(`\u001b[2K\u001b[0G${ask}${str}`);
          process.stdout.write(`\u001b[${insert + ask.length + 1}G`);
          buf = Buffer.alloc(3);
        }
        continue; // any other 3 character sequence is ignored
      }

      // if it is not a control character seq, assume only one character is read
      character = buf[read - 1];

      // catch a ^C and return null
      if (character === 3) {
        process.stdout.write('^C\n');
        fs.closeSync(fd);
        process.exit(130);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode!(!!wasRaw);
        }
        return null;
      }

      // catch the terminating character
      if (character === term) {
        fs.closeSync(fd);
        break;
      }

      if (
        character === 127 ||
        (process.platform === 'win32' && character === 8)
      ) {
        // backspace
        if (!insert) {
          continue;
        }
        str = str.slice(0, insert - 1) + str.slice(insert);
        insert--;
        process.stdout.write('\u001b[2D');
      } else {
        if (character < 32 || character > 126) {
          continue;
        }
        str =
          str.slice(0, insert) +
          String.fromCharCode(character) +
          str.slice(insert);
        insert++;
      }

      if (masked) {
        process.stdout.write(
          `\u001b[2K\u001b[0G${ask}${Array(str.length + 1).join(echo)}`,
        );
      } else {
        process.stdout.write('\u001b[s');
        if (insert === str.length) {
          process.stdout.write(`\u001b[2K\u001b[0G${ask}${str}`);
        } else if (ask) {
          process.stdout.write(`\u001b[2K\u001b[0G${ask}${str}`);
        } else {
          process.stdout.write(
            `\u001b[2K\u001b[0G${str}\u001b[${str.length - insert}D`,
          );
        }
        process.stdout.write('\u001b[u');
        process.stdout.write('\u001b[1C');
      }
    }

    process.stdout.write('\n');

    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(!!wasRaw);
    }

    return str || value || '';
  }
}

export default create;
