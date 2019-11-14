import findDependencies from '../findDependencies';
import {
  cleanup,
  writeFiles,
  getTempDirectory,
} from '../../../../../../jest/helpers';

jest.mock('../resolveNodeModuleDir');

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
