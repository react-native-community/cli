/**
 * @flow
 */

const getPackageConfiguration = require('./getPackageConfiguration');

module.exports = function getParams(root: string) {
  const config = getPackageConfiguration(root);
  return config.params || [];
};
