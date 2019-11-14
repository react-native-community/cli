import {CLIError} from '@react-native-community/cli-tools';

import resolveNodeModuleDir from './resolveNodeModuleDir';

/**
 * Finds path to React Native inside `node_modules` or throws
 * an error otherwise.
 */
export default function resolveReactNativePath(root: string) {
  try {
    return resolveNodeModuleDir(root, 'react-native');
  } catch (_ignored) {
    throw new CLIError(`
      Unable to find React Native files looking up from ${root}. Make sure "react-native" module is installed
      in your project dependencies.

      If you are using React Native from a non-standard location, consider setting:
      {
        reactNativePath: "./path/to/react-native"
      }
      in your \`react-native.config.js\`.
    `);
  }
}
