/**
 * @flow
 * 
 * @todo(grabbou): This file should be moved to a `link`-related folder.
 */

'use strict';

const getPackageConfiguration = require('./getPackageConfiguration');

module.exports = function getParams(root: string) {
  const config = getPackageConfiguration(root);
  return config.params || [];
};
