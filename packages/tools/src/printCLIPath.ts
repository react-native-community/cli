import path from 'path';
import pkg from '@react-native-community/cli/package.json';

/**
 * Print the location of the React Native CLI executable. That way, native build
 * tools (and autolinking scripts) can access the CLI without issues.
 */
export default () =>
  console.log(
    require.resolve(
      path.join('@react-native-community/cli/', pkg.bin['react-native']),
    ),
  );
