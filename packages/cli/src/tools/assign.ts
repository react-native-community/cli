/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 *
 * Similar to Object.assign(), but it doesn't execute getters. This allows us to have
 * lazy properties on an object and still be able to merge them together
 *
 */
export default function assign(target: Object, ...sources: Object[]) {
  sources.forEach(source => {
    let descriptors = Object.keys(source).reduce(
      (acc, key) => {
        const propertyDescriptor = Object.getOwnPropertyDescriptor(source, key);
        if (propertyDescriptor !== undefined) {
          acc[key] = propertyDescriptor;
        }
        return acc;
      },
      {} as PropertyDescriptorMap,
    );
    // by default, Object.assign copies enumerable Symbols too
    Object.getOwnPropertySymbols(source).forEach(sym => {
      let descriptor = Object.getOwnPropertyDescriptor(source, sym);
      if (descriptor && descriptor.enumerable) {
        descriptors[sym.toString()] = descriptor;
      }
    });
    Object.defineProperties(target, descriptors);
  });
  return target;
}
