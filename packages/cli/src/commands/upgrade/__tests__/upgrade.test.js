// @flow
import execa from 'execa';
import path from 'path';
import fs from 'fs';
import snapshotDiff from 'snapshot-diff';
import stripAnsi from 'strip-ansi';
import upgrade from '../upgrade';
import {fetch} from '../../../tools/fetch';
import logger from '../../../tools/logger';
import loadConfig from '../../../tools/config';

jest.mock('https');
jest.mock('fs');
jest.mock('path');
jest.mock('execa');
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
jest.mock(
  '/project/root/NestedApp/node_modules/react-native/package.json',
  () => ({name: 'react-native', version: '0.57.8'}),
  {virtual: true},
);
jest.mock(
  '/project/root/NestedApp/package.json',
  () => ({
    name: 'TestAppNested',
    dependencies: {'react-native': '^0.57.8'},
  }),
  {virtual: true},
);
jest.mock('../../../tools/config');
jest.mock('../../../tools/packageManager', () => ({
  install: args => {
    mockPushLog('$ yarn add', ...args);
  },
}));
jest.mock('../../../tools/fetch', () => ({
  fetch: jest.fn(() => Promise.resolve('patch')),
}));
jest.mock('@react-native-community/cli-tools', () => ({
  logger: {
    info: jest.fn((...args) => mockPushLog('info', args)),
    error: jest.fn((...args) => mockPushLog('error', args)),
    warn: jest.fn((...args) => mockPushLog('warn', args)),
    success: jest.fn((...args) => mockPushLog('success', args)),
    log: jest.fn((...args) => mockPushLog(args)),
  },
}));

const mockExecaDefault = (command, args) => {
  mockPushLog('$', 'execa', command, args);
  if (command === 'npm' && args[3] === '--json') {
    return Promise.resolve({stdout: '{"react": "16.6.3"}'});
  }
  if (command === 'git' && args[0] === 'rev-parse') {
    return Promise.resolve({stdout: ''});
  }
  return Promise.resolve({stdout: ''});
};

const mockExecaNested = (command, args) => {
  mockPushLog('$', 'execa', command, args);
  if (command === 'npm' && args[3] === '--json') {
    return Promise.resolve({stdout: '{"react": "16.6.3"}'});
  }
  if (command === 'git' && args[0] === 'rev-parse') {
    return Promise.resolve({stdout: 'NestedApp/'});
  }
  return Promise.resolve({stdout: ''});
};

const currentVersion = '0.57.8';
const newVersion = '0.58.4';
const olderVersion = '0.56.0';
const ctx = loadConfig();
const opts = {
  legacy: false,
};

const samplePatch = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, './sample.patch'), 'utf8');

let logs = [];
const mockPushLog = (...args) =>
  logs.push(args.map(x => (Array.isArray(x) ? x.join(' ') : x)).join(' '));
const flushOutput = () => stripAnsi(logs.join('\n'));

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // $FlowFixMe
  fs.writeFileSync = jest.fn(filename => mockPushLog('[fs] write', filename));
  // $FlowFixMe
  fs.unlinkSync = jest.fn((...args) => mockPushLog('[fs] unlink', args));
  logs = [];
  (execa: any).mockImplementation(mockExecaDefault);
});

afterEach(() => {
  // $FlowFixMe
  fs.writeFileSync = jest.requireMock('fs').writeFileSync;
  // $FlowFixMe
  fs.unlinkSync = jest.requireMock('fs').unlinkSync;
});

test('uses latest version of react-native when none passed', async () => {
  await upgrade.func([], ctx, opts);
  expect(execa).toBeCalledWith('npm', ['info', 'react-native', 'version']);
}, 60000);

test('applies patch in current working directory when nested', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  (execa: any).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config, opts);

  expect(execa).toBeCalledWith('git', [
    'apply',
    'tmp-upgrade-rn.patch',
    '--exclude=NestedApp/package.json',
    '-p2',
    '--3way',
    '--directory=NestedApp/',
  ]);
});

test('errors when invalid version passed', async () => {
  await upgrade.func(['next'], ctx, opts);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version',
  );
}, 60000);

test('errors when older version passed', async () => {
  await upgrade.func([olderVersion], ctx, opts);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`,
  );
}, 60000);

test('warns when dependency upgrade version is in semver range', async () => {
  await upgrade.func([currentVersion], ctx, opts);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^0.57.8" semver range. No need to upgrade`,
  );
}, 60000);

test('fetches empty patch and installs deps', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(''));
  await upgrade.func([newVersion], ctx, opts);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
info Diff has no changes to apply, proceeding further
info Installing \\"react-native@0.58.4\\" and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
}, 60000);

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  await upgrade.func(
    [newVersion],
    {
      ...ctx,
      project: {
        ...ctx.project,
        ios: {
          ...ctx.project.ios,
          projectName: 'TestApp.xcodeproj',
        },
        android: {
          ...ctx.project.android,
          packageName: 'com.testapp',
        },
      },
    },
    opts,
  );
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git rev-parse --show-prefix
$ execa git apply --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way --directory=
info Applying diff...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json -p2 --3way --directory=
[fs] unlink tmp-upgrade-rn.patch
$ execa git status -s
info Installing \\"react-native@0.58.4\\" and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
info Running \\"git status\\" to check what changed...
$ execa git status
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
  expect(
    snapshotDiff(samplePatch, fs.writeFileSync.mock.calls[0][1], {
      contextLines: 1,
    }),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (TestApp and com.testapp)',
  );
}, 60000);
test('fetches regular patch, adds remote, applies patch, installs deps, removes remote when updated from nested directory', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  (execa: any).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config, opts);
  expect(flushOutput()).toMatchInlineSnapshot(`
"info Fetching diff between v0.57.8 and v0.58.4...
[fs] write tmp-upgrade-rn.patch
$ execa git rev-parse --show-prefix
$ execa git apply --check tmp-upgrade-rn.patch --exclude=NestedApp/package.json -p2 --3way --directory=NestedApp/
info Applying diff...
$ execa git apply tmp-upgrade-rn.patch --exclude=NestedApp/package.json -p2 --3way --directory=NestedApp/
[fs] unlink tmp-upgrade-rn.patch
$ execa git status -s
info Installing \\"react-native@0.58.4\\" and its peer dependencies...
$ execa npm info react-native@0.58.4 peerDependencies --json
$ yarn add react-native@0.58.4 react@16.6.3
$ execa git add package.json
$ execa git add yarn.lock
$ execa git add package-lock.json
info Running \\"git status\\" to check what changed...
$ execa git status
success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
`);
}, 60000);
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
    if (command === 'git' && args[0] === 'rev-parse') {
      return Promise.resolve({stdout: ''});
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
$ execa git rev-parse --show-prefix
$ execa git apply --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way --directory=
info Applying diff (excluding: package.json, .flowconfig)...
$ execa git apply tmp-upgrade-rn.patch --exclude=package.json --exclude=.flowconfig -p2 --3way --directory=
error: .flowconfig: does not exist in index
error Automatically applying diff failed
[fs] unlink tmp-upgrade-rn.patch
$ execa git status -s
error Patch failed to apply for unknown reason. Please fall back to manual way of upgrading
info You may find these resources helpful:
• Release notes: https://github.com/facebook/react-native/releases/tag/v0.58.4
• Comparison between versions: https://github.com/react-native-community/rn-diff-purge/compare/version/0.57.8..version/0.58.4
• Git diff: https://github.com/react-native-community/rn-diff-purge/compare/version/0.57.8..version/0.58.4.diff"
`);
}, 60000);
test('works with --name-ios and --name-android', async () => {
  (fetch: any).mockImplementation(() => Promise.resolve(samplePatch));
  await upgrade.func(
    [newVersion],
    {
      ...ctx,
      project: {
        ...ctx.project,
        ios: {
          ...ctx.project.ios,
          projectName: 'CustomIos.xcodeproj',
        },
        android: {
          ...ctx.project.android,
          packageName: 'co.uk.customandroid.app',
        },
      },
    },
    opts,
  );
  expect(
    snapshotDiff(samplePatch, fs.writeFileSync.mock.calls[0][1], {
      contextLines: 1,
    }),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (CustomIos and co.uk.customandroid.app)',
  );
}, 60000);
