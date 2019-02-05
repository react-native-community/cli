/**
 * @flow
 */

import getPackageConfiguration from './getPackageConfiguration';

export default function getParams(root: string) {
  const config = getPackageConfiguration(root);
  return config.params || [];
}
