/**
 * @flow
 */

import deepmerge from 'deepmerge';

/**
 * `deepmerge` concatenates arrays by default instead of overwriting them.
 * We define custom merging function for arrays to change that behaviour
 */
export default function merge(...objs: Array<{[key: string]: any}>) {
  return deepmerge(...objs, {
    arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
  });
}
