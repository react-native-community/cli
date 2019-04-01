/**
 * @flow
 */
import path from 'path';

/**
 * Finds path to React Native inside `node_modules` or throws
 * an error otherwise.
 */
export default function resolveReactNativePath(root: string) {
  try {
    return path.dirname(
      // $FlowIssue: Wrong `require.resolve` type definition
      require.resolve('react-native/package.json', {
        paths: [root],
      }),
    );
  } catch (_ignored) {
    return null;
  }
}
