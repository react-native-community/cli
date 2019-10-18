/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import path from 'path';
import runServer from './runServer';

export default {
  name: 'start',
  func: runServer,
  description: 'starts the webserver',
  options: [
    {
      name: '--port [number]',
      parse: (val: string) => Number(val),
    },
    {
      name: '--host [string]',
      default: '',
    },
    {
      name: '--reset-cache, --resetCache',
      description: 'Removes cached files',
    },
    {
      name: '--custom-log-reporter-path, --customLogReporterPath [string]',
      description:
        'Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter',
    },
    {
      name: '--verbose',
      description: 'Enables logging',
    },
    {
      name: '--https',
      description: 'Enables https connections to the server',
    },
    {
      name: '--key [path]',
      description: 'Path to custom SSL key',
    },
    {
      name: '--cert [path]',
      description: 'Path to custom SSL cert',
    },
    {
      name: '--config [string]',
      description: 'Path to the CLI configuration file',
      parse: (val: string) => path.resolve(val),
    },
  ],
};
