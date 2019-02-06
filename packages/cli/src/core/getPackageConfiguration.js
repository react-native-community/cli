/**
 * @flow
 */
import path from 'path';
import type { PackageConfigurationT } from './types.flow';

/**
 * Returns configuration of the CLI from `package.json`.
 */
module.exports = function getPackageConfiguration(
  folder: string
): PackageConfigurationT {
  // $FlowFixMe: Non-literal require
  return require(path.join(folder, './package.json')).rnpm || {};
};
