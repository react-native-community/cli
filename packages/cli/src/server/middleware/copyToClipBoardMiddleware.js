/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const copyToClipBoard = require('../util/copyToClipBoard');

/**
 * Handle the request from JS to copy contents onto host system clipboard.
 * This is only supported on Mac for now.
 */
module.exports = function copyMiddleware(req, res, next) {
  if (req.url === '/copy-to-clipboard') {
    const ret = copyToClipBoard(req.rawBody);
    if (!ret) {
      console.warn(chalk.red('Copy button is not supported on this platform!'));
    }
    res.end('OK');
  } else {
    next();
  }
};
