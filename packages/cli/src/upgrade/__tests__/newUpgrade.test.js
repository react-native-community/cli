// @flow
import execa from 'execa';
import path from 'path';
import fs from 'fs';
import snapshotDiff from 'snapshot-diff';
import * as upgrade from '../newUpgrade';
import { fetch } from '../helpers';
import logger from '../../util/logger';

jest.mock('https');
jest.mock('fs');
jest.mock('path');
jest.mock('execa', () => {
  const module = jest.fn((command, args) => {
    mockPushLog('$', 'execa', command, args);
    if (command === 'npm' && args[3] === '--json') {
      return Promise.resolve({
        stdout: '{"react": "16.6.3"}',
      });
    }
    return Promise.resolve({ stdout: '' });
  });
  return module;
});
jest.mock(
  '/project/root/node_modules/react-native/package.json',
  () => ({ name: 'react-native', version: '0.57.8' }),
  { virtual: true }
);
jest.mock(
  '/project/root/package.json',
  () => ({ name: 'TestApp', dependencies: { 'react-native': '^0.57.8' } }),
  { virtual: true }
);
jest.mock('../../util/PackageManager', () =>
  jest.fn(() => ({
    install: args => {
      mockPushLog('$ yarn add', ...args);
    },
  }))
);
jest.mock('../helpers', () => ({
  ...jest.requireActual('../helpers'),
  fetch: jest.fn(() => Promise.resolve('patch')),
}));
jest.mock('../../util/logger', () => ({
  info: jest.fn((...args) => mockPushLog('info', args)),
  error: jest.fn((...args) => mockPushLog('error', args)),
  warn: jest.fn((...args) => mockPushLog('warn', args)),
  success: jest.fn((...args) => mockPushLog('success', args)),
}));

const currentVersion = '0.57.8';
const newVersion = '0.58.4';
const olderVersion = '0.56.0';
const ctx = {
  root: '/project/root',
  reactNativePath: '',
};

const samplePatch = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, './sample.patch'), 'utf8');

let logs = [];
const mockPushLog = (...args) =>
  logs.push(args.map(x => (Array.isArray(x) ? x.join(' ') : x)).join(' '));
const flushOutput = () => logs.join('\n');

beforeEach(() => {
  jest.clearAllMocks();
  // $FlowFixMe
  fs.writeFileSync = jest.fn(filename => mockPushLog('[fs] write', filename));
  // $FlowFixMe
  fs.unlinkSync = jest.fn((...args) => mockPushLog('[fs] unlink', args));
  logs = [];
});

test('uses latest version of react-native when none passed', async () => {
  await upgrade.default.func([], ctx);
  expect(execa).toBeCalledWith('npm', ['info', 'react-native', 'version']);
});

test('errors when invalid version passed', async () => {
  await upgrade.default.func(['next'], ctx);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version'
  );
});

test('errors when older version passed', async () => {
  await upgrade.default.func([olderVersion], ctx);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`
  );
});

test('warns when dependency upgrade version is in semver range', async () => {
  await upgrade.default.func([currentVersion], ctx);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^0.57.8" semver range. No need to upgrade`
  );
});

test('fetches empty patch and installs deps', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(''));
  await upgrade.default.func([newVersion], ctx);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
info Diff has no changes to apply, proceeding further
info Installing react-native@0.58.4 and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
});

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  await upgrade.default.func([newVersion], ctx);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git remote add tmp-rn-diff-purge https://github.com/pvinis/rn-diff-purge.git
$ execa git fetch tmp-rn-diff-purge
info Applying diff...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json -p2 --3way
info Installing react-native@0.58.4 and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
[fs] unlink tmp-upgrade-rn.patch
$ execa git remote remove tmp-rn-diff-purge
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);

  expect(
    snapshotDiff(samplePatch, fs.writeFileSync.mock.calls[0][1], {
      contextLines: 1,
    })
  ).toMatchSnapshot('RnDiffApp is replaced with app name (TestApp)');
});

test('cleans up if patching fails,', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  (execa: any).mockImplementation((command, args) => {
    mockPushLog('$', 'execa', command, args);
    if (command === 'npm' && args[3] === '--json') {
      return Promise.resolve({
        stdout: '{"react": "16.6.3"}',
      });
    }
    if (command === 'git' && args[0] === 'apply') {
      throw new Error({ code: 1, stderr: 'error patching' });
    }
    return Promise.resolve({ stdout: '' });
  });

  await upgrade.default.func([newVersion], ctx);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git remote add tmp-rn-diff-purge https://github.com/pvinis/rn-diff-purge.git
$ execa git fetch tmp-rn-diff-purge
info Applying diff...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json -p2 --3way
error Applying diff failed. Please review the conflicts and resolve them.
info You may find release notes helpful: https://github.com/facebook/react-native/releases/tag/v0.58.4
[fs] unlink tmp-upgrade-rn.patch
$ execa git remote remove tmp-rn-diff-purge"
`);
});
