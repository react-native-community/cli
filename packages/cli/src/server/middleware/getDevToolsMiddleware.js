/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import launchChrome from '../util/launchChrome';
import logger from '../../util/logger';

function launchChromeDevTools(host, port, args = '') {
  const debuggerURL = `http://${host}:${port}/debugger-ui${args}`;
  logger.info('Launching Dev Tools...');
  launchChrome(debuggerURL);
}

function launchDevTools({ host, port, watchFolders }, isChromeConnected) {
  // Explicit config always wins
  const customDebugger = process.env.REACT_DEBUGGER;
  if (customDebugger) {
    customDebugger({ watchFolders, customDebugger });
  } else if (!isChromeConnected()) {
    // Dev tools are not yet open; we need to open a session
    launchChromeDevTools(host, port);
  }
}

module.exports = function getDevToolsMiddleware(options, isChromeConnected) {
  return function devToolsMiddleware(req, res, next) {
    if (req.url === '/launch-safari-devtools') {
      // TODO: remove `logger.info` and dev tools binary
      logger.info(
        'We removed support for Safari dev-tools. ' +
          'If you still need this, please let us know.'
      );
    } else if (req.url === '/launch-chrome-devtools') {
      // TODO: Remove this case in the future
      logger.info(
        'The method /launch-chrome-devtools is deprecated. You are ' +
          ' probably using an application created with an older CLI with the ' +
          ' packager of a newer CLI. Please upgrade your application: ' +
          'https://facebook.github.io/react-native/docs/upgrading.html'
      );
      launchDevTools(options, isChromeConnected);
      res.end('OK');
    } else if (req.url === '/launch-js-devtools') {
      launchDevTools(options, isChromeConnected);
      res.end('OK');
    } else {
      next();
    }
  };
};
