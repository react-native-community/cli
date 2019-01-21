/**
 * @flow
 */
import type { PackageConfigurationT } from './types.flow';

const path = require('path');

/**
 * Returns configuration of the CLI from `package.json`.
 */
module.exports = function getPackageConfiguration(
  folder: string
): PackageConfigurationT {
  // $FlowFixMe: Non-literal require
  return require(path.join(folder, './package.json')).rnpm || {};
};
