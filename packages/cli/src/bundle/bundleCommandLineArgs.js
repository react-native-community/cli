/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';

export type CommandLineArgs = {
  assetsDest?: string,
  entryFile: string,
  resetCache: boolean,
  resetGlobalCache: boolean,
  transformer?: string,
  minify?: boolean,
  config?: string,
  platform?: string,
  dev: boolean,
  bundleOutput: string,
  bundleEncoding?: string,
  maxWorkers?: number,
  sourcemapOutput?: string,
  sourcemapSourcesRoot?: string,
  sourcemapUseAbsolutePath: boolean,
  verbose: boolean,
};

module.exports = [
  {
    command: '--entry-file <path>',
    description:
      'Path to the root JS file, either absolute or relative to JS root',
  },
  {
    command: '--platform [string]',
    description: 'Either "ios" or "android"',
    default: 'ios',
  },
  {
    command: '--transformer [string]',
    description: 'Specify a custom transformer to be used',
  },
  {
    command: '--dev [boolean]',
    description: 'If false, warnings are disabled and the bundle is minified',
    parse: (val: string) => val !== 'false',
    default: true,
  },
  {
    command: '--minify [boolean]',
    description:
      'Allows overriding whether bundle is minified. This defaults to ' +
      'false if dev is true, and true if dev is false. Disabling minification ' +
      'can be useful for speeding up production builds for testing purposes.',
    parse: (val: string) => val !== 'false',
  },
  {
    command: '--bundle-output <string>',
    description:
      'File name where to store the resulting bundle, ex. /tmp/groups.bundle',
  },
  {
    command: '--bundle-encoding [string]',
    description:
      'Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer).',
    default: 'utf8',
  },
  {
    command: '--max-workers [number]',
    description:
      'Specifies the maximum number of workers the worker-pool ' +
      'will spawn for transforming files. This defaults to the number of the ' +
      'cores available on your machine.',
    parse: (workers: string) => Number(workers),
  },
  {
    command: '--sourcemap-output [string]',
    description:
      'File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map',
  },
  {
    command: '--sourcemap-sources-root [string]',
    description:
      "Path to make sourcemap's sources entries relative to, ex. /root/dir",
  },
  {
    command: '--sourcemap-use-absolute-path',
    description: 'Report SourceMapURL using its full path',
    default: false,
  },
  {
    command: '--assets-dest [string]',
    description:
      'Directory name where to store assets referenced in the bundle',
  },
  {
    command: '--reset-cache',
    description: 'Removes cached files',
    default: false,
  },
  {
    command: '--read-global-cache',
    description:
      'Try to fetch transformed JS code from the global cache, if configured.',
    default: false,
  },
  {
    command: '--config [string]',
    description: 'Path to the CLI configuration file',
    parse: (val: string) => path.resolve(val),
  },
];
