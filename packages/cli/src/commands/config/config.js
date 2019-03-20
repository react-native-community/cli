/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import loadConfig from '../../tools/loadConfig';

import getPlatforms from '../../tools/getPlatforms';
import getProjectConfig from '../link/getProjectConfig';
import getDependencyConfig from '../link/getDependencyConfig';
import getProjectDependencies from '../link/getProjectDependencies';

export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async () => {
    const config = await loadConfig();

    const platforms = getPlatforms(config.root);
    const project = getProjectConfig(config, platforms);

    const depenendencies = getProjectDependencies(config.root).reduce(
      (acc, dependency) => {
        acc[dependency] = getDependencyConfig(config, platforms, dependency);
        return acc;
      },
      {},
    );

    console.log(
      JSON.stringify(
        {
          ...config,
          platforms: Object.keys(platforms),
          project,
          depenendencies,
        },
        null,
        2,
      ),
    );
  },
};
