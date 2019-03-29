/**
 * @flow
 */

import path from 'path';
import {union} from 'lodash';

const pluginRe = new RegExp(
  [
    '^react-native-',
    '^@(.*)/react-native-',
    '^@react-native(.*)/(?!rnpm-plugin-)',
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

  const deps = union(
    Object.keys(pjson.dependencies || {}),
    Object.keys(pjson.devDependencies || {}),
  );

  return deps.filter(dependency => pluginRe.test(dependency));
}
