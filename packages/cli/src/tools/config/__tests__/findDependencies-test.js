/**
 * @flow
 */

import findDependencies from '../findDependencies';

const path = require('path');

import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../e2e/helpers';

beforeEach(() => {
  cleanup(DIR);
  jest.resetModules();
});

afterEach(() => cleanup(DIR));

const DIR = getTempDirectory('find_dependencies_test');

test('returns plugins from both dependencies and dev dependencies', () => {
  writeFiles(DIR, {
    'package.json': `
      {
        "dependencies": {"rnpm-plugin-test": "*"},
        "devDependencies": {"rnpm-plugin-test-2": "*"}
      }
    `,
  });
  expect(findDependencies(DIR)).toHaveLength(2);
});

test('returns plugins in scoped modules', () => {
  writeFiles(DIR, {
    'package.json': `
      {
        "dependencies": {
          "@org/rnpm-plugin-test": "*",
          "@org/react-native-test": "*",
          "@react-native/test": "*",
          "@react-native-org/test": "*"
        }
      }
    `,
  });
  expect(findDependencies(DIR)).toHaveLength(4);
});
