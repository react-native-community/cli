/**
 * @flow
 */
import path from 'path';

function resolveReactNativePath() {
  try {
    return path.dirname(
      // $FlowIssue: Wrong `require.resolve` type definition
      require.resolve('react-native/package.json', {
        paths: [process.cwd()],
      }),
    );
  } catch (_ignored) {
    throw new Error(
      'Unable to find React Native files. Make sure "react-native" module is installed in your project dependencies.',
    );
  }
}

export default resolveReactNativePath;
