import findDependencies from '../findDependencies';
import {cleanup, writeFiles, getTempDirectory} from '../../../../jest/helpers';

beforeEach(async () => {
  await cleanup(DIR);
  jest.resetModules();
});

afterEach(async () => await cleanup(DIR));

const DIR = getTempDirectory('find_dependencies_test');

test('returns plugins from both dependencies and dev dependencies', () => {
  writeFiles(DIR, {
    'package.json': `
      {
        "name": "plugin",
        "version": "1.0.0",
        "dependencies": {"rnpm-plugin-test": "*"},
        "devDependencies": {"rnpm-plugin-test-2": "*"}
      }
    `,
    'node_modules/rnpm-plugin-test/package.json': `
    {
      "name": "rnpm-plugin-test",
      "version": "1.0.0"

    }`,
    'node_modules/rnpm-plugin-test-2/package.json': `
    {
      "name": "rnpm-plugin-test-2",
      "version": "1.0.0"
    }`,
  });

  expect(findDependencies(DIR).size).toBe(3);
});
