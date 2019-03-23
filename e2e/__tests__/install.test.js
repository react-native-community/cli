// @flow
import {runCli, getTempDirectory, cleanup, writeFiles} from '../helpers';

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

test('install module with yarn', () => {
  writeFiles(DIR, {'yarn.lock': ''});
  const {stdout, code} = runCli(DIR, ['install', pkg]);

  expect(stdout).toContain(`Installing "${pkg}"`);
  expect(stdout).toContain(`Linking "${pkg}"`);
  expect(stdout).toContain(`Successfully installed and linked "${pkg}"`);
  expect(code).toBe(0);
});

test('install module with npm', () => {
  const {stdout, code} = runCli(DIR, ['install', pkg]);

  expect(stdout).toContain(`Installing "${pkg}"`);
  expect(stdout).toContain(`Linking "${pkg}"`);
  expect(stdout).toContain(`Successfully installed and linked "${pkg}"`);
  expect(code).toBe(0);
});
