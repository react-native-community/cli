import path from 'path';
import os from 'os';

import loadConfig from '../';

import {cleanup, writeFiles} from '../../../../../../e2e/helpers';

const DIR = path.resolve(os.tmpdir(), 'resolve_config_path_test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe('config', () => {
  it('should have a valid structure by default', () => {
    writeFiles(DIR, {
      'package.json': JSON.stringify({
        dependencies: {},
        devDependencies: {},
        'react-native': {reactNativePath: '.'},
      }),
    });
    const {root, ...config} = loadConfig(DIR);
    expect(root).toBe(DIR);
    expect(config).toMatchSnapshot();
  });
});
