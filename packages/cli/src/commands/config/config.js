/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import loadConfig from '../../tools/loadConfig';

export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async () => {
    const config = await loadConfig();

    console.log(JSON.stringify(config, null, 2));
  },
};
