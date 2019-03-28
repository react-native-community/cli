// @flow
import {run, getTempDirectory, cleanup, writeFiles} from '../helpers';

const DIR = getTempDirectory('command-uninstall-test');
const pkg = 'react-native-config';

beforeEach(() => {
  cleanup(DIR);
  writeFiles(DIR, {
    'node_modules/react-native/package.json': '{}',
    'node_modules/react-native-config/package.json': '{}',
    'package.json': `{
      "dependencies": {
        "react-native-config": "*"
      }
    }`,
  });
});
afterEach(() => cleanup(DIR));

test('uninstall fails when package is not defined', () => {
  writeFiles(DIR, {
    'package.json': `{
      "dependencies": {}
    }`,
  });
  const {stderr, code} = run(DIR, ['uninstall']);

  expect(stderr).toContain('missing required argument');
  expect(code).toBe(1);
});

test('uninstall fails when package is not installed', () => {
  writeFiles(DIR, {
    'package.json': `{
      "dependencies": {}
    }`,
  });
  const {stderr, code} = run(DIR, ['uninstall', pkg]);

  expect(stderr).toContain(`Project "${pkg}" is not a react-native library`);
  expect(code).toBe(1);
});

test.each(['yarn', 'npm'])('uninstall module with %s', pm => {
  if (pm === 'yarn') {
    writeFiles(DIR, {'yarn.lock': ''});
  }
  const {stdout, code} = run(DIR, ['uninstall', pkg]);

  expect(stdout).toContain(`Unlinking "${pkg}"`);
  expect(stdout).toContain(`Uninstalling "${pkg}"`);
  expect(stdout).toContain(`Successfully uninstalled and unlinked "${pkg}"`);
  expect(code).toBe(0);
});
