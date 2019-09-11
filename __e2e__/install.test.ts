// @flow
import path from 'path';
import {run, getTempDirectory, cleanup, writeFiles} from '../jest/helpers';

const DIR = getTempDirectory('command-install-test');
const pkg = 'react-native-config';

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'package.json': '{}',
  });
});
afterEach(() => cleanup(DIR));

test.each(['yarn', 'npm'])('install module with %s', pm => {
  if (pm === 'yarn') {
    writeFiles(DIR, {'yarn.lock': ''});
  }
  const {stdout, code} = run(DIR, ['install', pkg]);

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
