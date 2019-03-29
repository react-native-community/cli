import path from 'path';
import os from 'os';

import loadConfig from '../';

const root = path.resolve(os.tmpdir(), 'resolve_config_path_test');

beforeEach(() => cleanup(root));
afterEach(() => cleanup(root));

describe('config', () => {
  it('should have a valid structure by default', () => {
    fs.__setMockFilesystem({
      root: {
        'react-native.config.js': JSON.stringify({
          reactNativePath: '.',
        }),
        'package.json': JSON.stringify({
          dependencies: {},
          devDependencies: {},
        }),
      },
    });
    const config = loadConfig(root);
    console.log(config);
  });
});
