/**
 * @flow
 */
import path from 'path';

/**
 * Finds path to React Native inside `node_modules` or throws
 * an error otherwise.
 */
export default function resolveReactNativePath() {
  try {
    return path.dirname(
      // $FlowIssue: Wrong `require.resolve` type definition
      require.resolve('react-native/package.json', {
        paths: [process.cwd()],
      }),
    );
  } catch (_ignored) {
    return 'not-found';
  }
}
