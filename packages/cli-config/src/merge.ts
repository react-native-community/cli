import deepmerge from 'deepmerge';

/**
 * `deepmerge` concatenates arrays by default instead of overwriting them.
 * We define custom merging function for arrays to change that behaviour
 */
export default function merge<X, Y>(x: Partial<X>, y: Partial<Y>) {
  return deepmerge(x, y, {
    arrayMerge: (_destinationArray: any[], sourceArray: any[]): any[] =>
      sourceArray,
  });
}
