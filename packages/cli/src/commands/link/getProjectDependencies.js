/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import path from 'path';

/**
 * List of projects that should not be treated as projects to be linked.
 *
 * That includes `react-native` itself and the CLI project (under its real and staging npm package).
 */
const EXCLUDED_PROJECTS = [
  'react-native',
  '@react-native-community/cli',
  'react-native-local-cli-preview',
];

/**
 * Returns an array of dependencies that should be linked/checked.
 */
export default function getProjectDependencies(cwd: string) {
  const pkgJson = require(path.join(cwd, './package.json'));
  return (Object.keys(pkgJson.dependencies || {}).filter(
    name => EXCLUDED_PROJECTS.includes(name) === false,
  ): Array<string>);
}
