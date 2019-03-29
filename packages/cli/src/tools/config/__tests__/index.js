import path from 'path';
import os from 'os';

import loadConfig from '../';

import {cleanup, writeFiles} from '../../../../../../e2e/helpers';

const root = path.resolve(os.tmpdir(), 'resolve_config_path_test');

beforeEach(() => cleanup(root));
afterEach(() => cleanup(root));

describe('config', () => {
  it('should have a valid structure by default', () => {
    writeFiles(root, {
      'package.json': JSON.stringify({
        dependencies: {},
        devDependencies: {},
        'react-native': {reactNativePath: '.'},
      }),
    });
    const {root: _root, ...config} = loadConfig(root);
    expect(config).toMatchSnapshot();
  });
});
