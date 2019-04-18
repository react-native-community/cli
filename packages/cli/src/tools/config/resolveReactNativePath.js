/**
 * @flow
 */
import path from 'path';
import {CLIError} from '@react-native-community/cli-tools';

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
    throw new CLIError(`
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
