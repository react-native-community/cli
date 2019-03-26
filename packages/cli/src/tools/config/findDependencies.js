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

function findDependencies() {
  let pjson;

  try {
    pjson = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {
    return [];
  }

  const deps = union(
    Object.keys(pjson.dependencies || {}),
    Object.keys(pjson.devDependencies || {}),
  );

  return deps.filter(dependency => pluginRe.test(dependency));
}

export default findDependencies;
