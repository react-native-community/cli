import {getTempDirectory, writeFiles} from '../../../../jest/helpers';
import resolveNodeModuleDir from '../resolveNodeModuleDir';
import path from 'path';

const DIR = getTempDirectory('resolve_node_module_dir_test');

describe('resolveNodeModuleDir', () => {
  it('returns resolved directory', () => {
    writeFiles(DIR, {
      'node_modules/test-package/package.json': '{}',
    });
    expect(resolveNodeModuleDir(DIR, 'test-package')).toEqual(
      path.join(DIR, 'node_modules/test-package'),
    );
  });
});
