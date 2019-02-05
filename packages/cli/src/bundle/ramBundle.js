/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import outputUnbundle from 'metro/src/shared/output/RamBundle';

import { withOutput as bundleWithOutput } from './bundle';
import bundleCommandLineArgs from './bundleCommandLineArgs';

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function ramBundle(argv, config, args) {
  return bundleWithOutput(argv, config, args, outputUnbundle);
}

module.exports = {
  name: 'ram-bundle',
  description:
    'builds javascript as a "Random Access Module" bundle for offline use',
  func: ramBundle,
  options: bundleCommandLineArgs.concat({
    command: '--indexed-ram-bundle',
    description:
      'Force the "Indexed RAM" bundle file format, even when building for android',
    default: false,
  }),
};
