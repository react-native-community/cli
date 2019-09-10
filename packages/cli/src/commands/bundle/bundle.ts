/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {Config} from '@react-native-community/cli-types';
import {CommandLineArgs} from './bundleCommandLineArgs';
import buildBundle from './buildBundle';
import bundleCommandLineArgs from './bundleCommandLineArgs';

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(
  _: Array<string>,
  config: Config,
  args: CommandLineArgs,
  output: any,
) {
  return buildBundle(args, config, output);
}

export default {
  name: 'bundle',
  description: 'builds the javascript bundle for offline use',
  func: bundleWithOutput,
  options: bundleCommandLineArgs,
  // Used by `ramBundle.js`
  withOutput: bundleWithOutput,
};

const withOutput = bundleWithOutput;

export {withOutput};
