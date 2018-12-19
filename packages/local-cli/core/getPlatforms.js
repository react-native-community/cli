/**
 * @flow
 */

import type { PlatformsT } from './types.flow';

const path = require('path');
const findPlugins = require('./findPlugins');

/**
 * Support for `ios` and `android` platforms is built-in
 *
 * @todo(grabbou): Move this out of the core to increase "interoperability"
 * with other platforms
 */
const builtInPlatforms = {
  ios: require('./ios'),
  android: require('./android'),
};

/**
 * Returns an object with available platforms
 */
module.exports = function getPlatforms(root: string): PlatformsT {
  const plugins = findPlugins(root);

  /**
   * Each `platfom` is a file that should define an object with platforms available
   * and the config required.
   *
   * @todo(grabbou): We should validate if the config loaded is correct, warn and skip
   * using it if it's invalid.
   */
  const projectPlatforms = plugins.platforms.reduce(
    (acc, pathToPlatform) =>
      Object.assign(
        acc,
        // $FlowFixMe non-literal require
        require(path.join(root, 'node_modules', pathToPlatform))
      ),
    {}
  );

  return {
    ...builtInPlatforms,
    ...projectPlatforms,
  };
};
