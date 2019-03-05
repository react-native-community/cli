// @flow
import execa from 'execa';
import path from 'path';
import fs from 'fs';
import snapshotDiff from 'snapshot-diff';
import upgrade from '../upgrade';
import {fetch} from '../helpers';
import logger from '../../../tools/logger';

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
    return Promise.resolve({stdout: ''});
  });
  return module;
});
jest.mock(
  '/project/root/node_modules/react-native/package.json',
  () => ({name: 'react-native', version: '0.57.8'}),
  {virtual: true},
);
jest.mock(
  '/project/root/package.json',
  () => ({name: 'TestApp', dependencies: {'react-native': '^0.57.8'}}),
  {virtual: true},
);
jest.mock('../../../tools/PackageManager', () =>
  jest.fn(() => ({
    install: args => {
      mockPushLog('$ yarn add', ...args);
    },
  })),
);
jest.mock('../helpers', () => ({
  ...jest.requireActual('../helpers'),
  fetch: jest.fn(() => Promise.resolve('patch')),
}));
jest.mock('../../../tools/logger', () => ({
  info: jest.fn((...args) => mockPushLog('info', args)),
  error: jest.fn((...args) => mockPushLog('error', args)),
  warn: jest.fn((...args) => mockPushLog('warn', args)),
  success: jest.fn((...args) => mockPushLog('success', args)),
  log: jest.fn((...args) => mockPushLog(args)),
}));

const currentVersion = '0.57.8';
const newVersion = '0.58.4';
const olderVersion = '0.56.0';
const ctx = {
  root: '/project/root',
  reactNativePath: '',
};
const opts = {
  legacy: false,
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
  await upgrade.func([], ctx, opts);
  expect(execa).toBeCalledWith('npm', ['info', 'react-native', 'version']);
});

test('errors when invalid version passed', async () => {
  await upgrade.func(['next'], ctx, opts);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version',
  );
});

test('errors when older version passed', async () => {
  await upgrade.func([olderVersion], ctx, opts);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`,
  );
});

test('warns when dependency upgrade version is in semver range', async () => {
  await upgrade.func([currentVersion], ctx, opts);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^0.57.8" semver range. No need to upgrade`,
  );
});

test('fetches empty patch and installs deps', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(''));
  await upgrade.func([newVersion], ctx, opts);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
info Diff has no changes to apply, proceeding further
warn Continuing after failure. Most of the files are upgraded but you will need to deal with some conflicts manually
info Installing react-native@0.58.4 and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
});

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  await upgrade.func([newVersion], ctx, opts);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git remote add tmp-rn-diff-purge https://github.com/pvinis/rn-diff-purge.git
$ execa git fetch --no-tags tmp-rn-diff-purge
$ execa git apply --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way
info Applying diff...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json -p2 --3way
[fs] unlink tmp-upgrade-rn.patch
info Installing react-native@0.58.4 and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
info Running \\"git status\\" to check what changed...
$ execa git status
$ execa git remote remove tmp-rn-diff-purge
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
  expect(
    snapshotDiff(samplePatch, fs.writeFileSync.mock.calls[0][1], {
      contextLines: 1,
    }),
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
      return Promise.reject({
        code: 1,
        stderr: 'error: .flowconfig: does not exist in index\n',
      });
    }
    return Promise.resolve({stdout: ''});
  });
  try {
    await upgrade.func([newVersion], ctx, opts);
  } catch (error) {
    expect(error.message).toBe(
      'Upgrade failed. Please see the messages above for details',
    );
  }
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git remote add tmp-rn-diff-purge https://github.com/pvinis/rn-diff-purge.git
$ execa git fetch --no-tags tmp-rn-diff-purge
$ execa git apply --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way
info Applying diff (excluding: package.json, .flowconfig)...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json --exclude=.flowconfig -p2 --3way
[2merror: .flowconfig: does not exist in index[22m
error Automatically applying diff failed
info Here's the diff we tried to apply: https://github.com/pvinis/rn-diff-purge/compare/version/0.57.8...version/0.58.4
info You may find release notes helpful: https://github.com/facebook/react-native/releases/tag/v0.58.4
[fs] unlink tmp-upgrade-rn.patch
warn Continuing after failure. Most of the files are upgraded but you will need to deal with some conflicts manually
info Installing react-native@0.58.4 and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
info Running \\"git status\\" to check what changed...
$ execa git status
$ execa git remote remove tmp-rn-diff-purge
warn Please run \\"git diff\\" to review the conflicts and resolve them"
`);
});
