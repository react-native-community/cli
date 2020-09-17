import path from 'path';
import {
  runCLI,
  getTempDirectory,
  cleanupSync,
  writeFiles,
} from '../jest/helpers';

const DIR = getTempDirectory('command-install-test');
const pkg = 'react-native-config';

beforeEach(() => {
  cleanupSync(DIR);
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'package.json': '{}',
  });
});
afterEach(() => cleanupSync(DIR));

test.each(['yarn', 'npm'])('install module with %s', (pm) => {
  if (pm === 'yarn') {
    writeFiles(DIR, {'yarn.lock': ''});
  }
  const {stdout, code} = runCLI(DIR, ['install', pkg]);

  expect(stdout).toContain(`Installing "${pkg}"`);
  expect(stdout).toContain(`Linking "${pkg}"`);
  // TODO – this behavior is a bug, linking should fail/warn without native deps
  // to link. Not a high priority since we're changing how link works
  expect(stdout).toContain(`Successfully installed and linked "${pkg}"`);
  expect(require(path.join(DIR, 'package.json'))).toMatchObject({
    dependencies: {
      [pkg]: expect.any(String),
    },
  });
  expect(code).toBe(0);
});
