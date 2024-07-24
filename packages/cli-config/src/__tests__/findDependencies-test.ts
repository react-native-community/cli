import findDependencies from '../findDependencies';
import {cleanup, writeFiles, getTempDirectory} from '../../../../jest/helpers';

describe('findDependencies', () => {
  const DIR = getTempDirectory('find_dependencies_test');

  beforeEach(() => {
    cleanup(DIR);
    jest.resetModules();
  });

  afterEach(() => cleanup(DIR));

  test('returns packages from dependencies, peer and dev dependencies', () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify({
        dependencies: {'rnpm-plugin-test': '*'},
        peerDependencies: {'rnpm-plugin-test-2': '*'},
        devDependencies: {'rnpm-plugin-test-3': '*'},
      }),
    });
    expect(findDependencies(DIR)).toHaveLength(3);
  });

  test('dedupes dependencies', () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify({
        dependencies: {'rnpm-plugin-test': '*'},
        peerDependencies: {'rnpm-plugin-test-2': '*'},
        devDependencies: {'rnpm-plugin-test-2': '*'},
      }),
    });
    expect(findDependencies(DIR)).toHaveLength(2);
  });
});
