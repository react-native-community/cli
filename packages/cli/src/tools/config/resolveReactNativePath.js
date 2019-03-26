/**
 * @flow
 */
import path from 'path';
import dedent from 'dedent';

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
    throw new Error(dedent`
      Unable to find React Native files. Make sure "react-native" module is installed
      in your project dependencies.

      If you are using React Native from a non-standard location, consider setting:
      {
        "react-native": {
          "reactNativePath": "./path/to/react-native"
        }
      }
      in your \`package.json\`.
    `);
  }
}
