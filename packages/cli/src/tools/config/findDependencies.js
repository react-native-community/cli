/**
 * @flow
 */

import path from 'path';

const pluginRe = new RegExp(
  [
    // React Native patterns
    '^react-native-',
    '^@(.*)/react-native-',
    '^@react-native(.*)/(?!rnpm-plugin-)',

    // RNPM patterns to be deprecated
    '^rnpm-plugin-',
    '^@(.*)/rnpm-plugin-',
  ].join('|'),
);

/**
 * Returns an array of dependencies from project's package.json that
 * are likely to be React Native packages (see regular expression above)
 */
export default function findDependencies(root: string): Array<string> {
  let pjson;

  try {
    pjson = require(path.join(root, 'package.json'));
  } catch (e) {
    return [];
  }

  const deps = [
    ...Object.keys(pjson.dependencies || {}),
    ...Object.keys(pjson.devDependencies || {}),
  ];

  return deps.filter(dependency => pluginRe.test(dependency));
}
