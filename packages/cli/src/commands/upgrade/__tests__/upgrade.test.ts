import execa from 'execa';
import path from 'path';
import fs from 'fs';
import snapshotDiff from 'snapshot-diff';
import stripAnsi from 'strip-ansi';
import upgrade from '../upgrade';
import {fetch, logger} from '@react-native-community/cli-tools';
import loadConfig from '../../../tools/config';
import merge from '../../../tools/merge';

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
jest.mock('@react-native-community/cli-tools', () => ({
  ...jest.requireActual('@react-native-community/cli-tools'),
  fetch: jest.fn(),
  logger: {
    info: jest.fn((...args) => mockPushLog('info', args)),
    error: jest.fn((...args) => mockPushLog('error', args)),
    warn: jest.fn((...args) => mockPushLog('warn', args)),
    success: jest.fn((...args) => mockPushLog('success', args)),
    debug: jest.fn((...args) => mockPushLog('debug', args)),
    log: jest.fn((...args) => mockPushLog(args)),
  },
}));

const mockFetch = (value = '', status = 200) => {
  (fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({data: value, status}),
  );
};

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
  fs.writeFileSync = jest.fn(filename => mockPushLog('[fs] write', filename));
  fs.unlinkSync = jest.fn((...args) => mockPushLog('[fs] unlink', args));
  logs = [];
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaDefault);
  Object.defineProperty(process, 'platform', {
    value: 'darwin',
  });
});

afterEach(() => {
  fs.writeFileSync = jest.requireMock('fs').writeFileSync;
  fs.unlinkSync = jest.requireMock('fs').unlinkSync;
});

test('uses latest version of react-native when none passed', async () => {
  await upgrade.func([], ctx);
  expect(execa).toBeCalledWith('npm', ['info', 'react-native', 'version']);
}, 60000);

test('applies patch in current working directory when nested', async () => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config);

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
  await upgrade.func(['next'], ctx);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version',
  );
}, 60000);

test('errors when older version passed', async () => {
  await upgrade.func([olderVersion], ctx);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`,
  );
  await upgrade.func(['0.57.10'], ctx);
  expect(logger.error).not.toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "0.57.10"`,
  );
}, 60000);

test('warns when dependency upgrade version is in semver range', async () => {
  await upgrade.func([currentVersion], ctx);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^0.57.8" semver range. No need to upgrade`,
  );
}, 60000);

test('fetches empty patch and installs deps', async () => {
  mockFetch();
  await upgrade.func([newVersion], ctx);
  expect(flushOutput()).toMatchInlineSnapshot(`
    "info Fetching diff between v0.57.8 and v0.58.4...
    info Diff has no changes to apply, proceeding further
    info Installing \\"react-native@0.58.4\\" and its peer dependencies...
    $ execa npm info react-native@0.58.4 peerDependencies --json
    $ yarn add react-native@0.58.4 react@16.6.3
    $ execa git add package.json
    $ execa git add yarn.lock
    $ execa git add package-lock.json
    info Installing CocoaPods dependencies (this may take a few minutes)
    success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
  `);
}, 60000);

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
  mockFetch(samplePatch, 200);
  await upgrade.func(
    [newVersion],
    merge(ctx, {
      project: {
        ios: {projectName: 'TestApp.xcodeproj'},
        android: {packageName: 'com.testapp'},
      },
    }),
  );
  expect(flushOutput()).toMatchInlineSnapshot(`
    "info Fetching diff between v0.57.8 and v0.58.4...
    [fs] write tmp-upgrade-rn.patch
    $ execa git rev-parse --show-prefix
    $ execa git apply --binary --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way --directory=
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
    info Installing CocoaPods dependencies (this may take a few minutes)
    info Running \\"git status\\" to check what changed...
    $ execa git status
    success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
    `);
  expect(
    snapshotDiff(
      samplePatch,
      (fs.writeFileSync as jest.Mock).mock.calls[0][1],
      {
        contextLines: 1,
      },
    ),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (TestApp and com.testapp)',
  );
}, 60000);
test('fetches regular patch, adds remote, applies patch, installs deps, removes remote when updated from nested directory', async () => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config);
  expect(flushOutput()).toMatchInlineSnapshot(`
    "info Fetching diff between v0.57.8 and v0.58.4...
    [fs] write tmp-upgrade-rn.patch
    $ execa git rev-parse --show-prefix
    $ execa git apply --binary --check tmp-upgrade-rn.patch --exclude=NestedApp/package.json -p2 --3way --directory=NestedApp/
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
    info Installing CocoaPods dependencies (this may take a few minutes)
    info Running \\"git status\\" to check what changed...
    $ execa git status
    success Upgraded React Native to v0.58.4 🎉. Now you can review and commit the changes"
  `);
}, 60000);
test('cleans up if patching fails,', async () => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation((command, args) => {
    mockPushLog('$', 'execa', command, args);
    if (command === 'npm' && args[3] === '--json') {
      return Promise.resolve({
        stdout: '{"react": "16.6.3"}',
      });
    }
    if (command === 'git' && args[0] === 'apply') {
      return Promise.reject({
        code: 1,
        stderr:
          'error: .flowconfig: does not exist in index\nerror: ios/MyApp.xcodeproj/project.pbxproj: patch does not apply',
      });
    }
    if (command === 'git' && args[0] === 'rev-parse') {
      return Promise.resolve({stdout: ''});
    }
    return Promise.resolve({stdout: ''});
  });
  try {
    await upgrade.func([newVersion], ctx);
  } catch (error) {
    expect(error.message).toBe(
      'Upgrade failed. Please see the messages above for details',
    );
  }
  expect(flushOutput()).toMatchInlineSnapshot(`
    "info Fetching diff between v0.57.8 and v0.58.4...
    [fs] write tmp-upgrade-rn.patch
    $ execa git rev-parse --show-prefix
    $ execa git apply --binary --check tmp-upgrade-rn.patch --exclude=package.json -p2 --3way --directory=
    info Applying diff...
    warn Excluding files that exist in the template, but not in your project:
      - .flowconfig
    error Excluding files that failed to apply the diff:
      - ios/MyApp.xcodeproj/project.pbxproj
    Please make sure to check the actual changes after the upgrade command is finished.
    You can find them in our Upgrade Helper web app: https://react-native-community.github.io/upgrade-helper/?from=0.57.8&to=0.58.4
    $ execa git apply tmp-upgrade-rn.patch --exclude=package.json --exclude=.flowconfig --exclude=ios/MyApp.xcodeproj/project.pbxproj -p2 --3way --directory=
    debug \\"git apply\\" failed. Error output:
    error: .flowconfig: does not exist in index
    error: ios/MyApp.xcodeproj/project.pbxproj: patch does not apply
    error Automatically applying diff failed. We did our best to automatically upgrade as many files as possible
    [fs] unlink tmp-upgrade-rn.patch
    $ execa git status -s
    error Patch failed to apply for unknown reason. Please fall back to manual way of upgrading
    warn After resolving conflicts don't forget to run \\"pod install\\" inside \\"ios\\" directory
    info You may find these resources helpful:
    • Release notes: https://github.com/facebook/react-native/releases/tag/v0.58.4
    • Manual Upgrade Helper: https://react-native-community.github.io/upgrade-helper/?from=0.57.8&to=0.58.4
    • Git diff: https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/0.57.8..0.58.4.diff"
  `);
}, 60000);
test('works with --name-ios and --name-android', async () => {
  mockFetch(samplePatch, 200);
  await upgrade.func(
    [newVersion],
    merge(ctx, {
      project: {
        ios: {projectName: 'CustomIos.xcodeproj'},
        android: {packageName: 'co.uk.customandroid.app'},
      },
    }),
  );
  expect(
    snapshotDiff(
      samplePatch,
      (fs.writeFileSync as jest.Mock).mock.calls[0][1],
      {
        contextLines: 1,
      },
    ),
  ).toMatchSnapshot(
    'RnDiffApp is replaced with app name (CustomIos and co.uk.customandroid.app)',
  );
}, 60000);
