import execa from 'execa';
import path from 'path';
import fs from 'fs';
import snapshotDiff from 'snapshot-diff';
import stripAnsi from 'strip-ansi';
import upgrade from '../upgrade';
import {fetch, logger} from '@react-native-community/cli-tools';
import loadConfig from '../../../tools/config';
import merge from '../../../tools/merge';
import UpgradeTestingMethods from './upgrade-testing-methods';

jest.mock('https');
jest.mock('fs');
jest.mock('path');
jest.mock('execa');
jest.mock(
  '/project/root/node_modules/react-native/package.json',
  () => ({name: 'react-native-tvos', version: '0.62.2-1'}),
  {virtual: true},
);
jest.mock(
  '/project/root/package.json',
  () => ({
    name: 'TestApp',
    dependencies: {'react-native': 'npm:react-native-tvos@^0.62.2-1'},
  }),
  {virtual: true},
);
jest.mock(
  '/project/root/NestedApp/node_modules/react-native/package.json',
  () => ({name: 'react-native-tvos', version: '0.62.2-1'}),
  {virtual: true},
);
jest.mock(
  '/project/root/NestedApp/package.json',
  () => ({
    name: 'TestAppNested',
    dependencies: {'react-native': 'npm:react-native-tvos@^0.62.2-1'},
  }),
  {virtual: true},
);
jest.mock('../../../tools/config');
jest.mock('../../../tools/packageManager', () => ({
  install: (args) => {
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

const repoName = 'react-native-tvos';
const currentVersion = '0.62.2-1';
const newVersion = '0.64.2-4';
const olderVersion = '0.60.2-1';
const lessOlderVersion = '0.63.3-0';

const ctx = loadConfig();

const samplePatch = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, './sample.patch'), 'utf8');

let logs = [];
const mockPushLog = (...args) =>
  logs.push(args.map((x) => (Array.isArray(x) ? x.join(' ') : x)).join(' '));
const flushOutput = () => stripAnsi(logs.join('\n'));

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  fs.writeFileSync = jest.fn((filename) => mockPushLog('[fs] write', filename));
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
  await UpgradeTestingMethods.usesLatestVersionWhenNonePassed(
    upgrade,
    ctx,
    execa,
    repoName,
  );
}, 60000);

test('applies patch in current working directory when nested', async () => {
  await UpgradeTestingMethods.appliesPatchInCwdWhenNested(
    mockFetch,
    samplePatch,
    execa,
    mockExecaNested,
    ctx,
    upgrade,
    newVersion,
  );
});

test('errors when invalid version passed', async () => {
  await UpgradeTestingMethods.errorsWhenInvalidVersionPassed(
    upgrade,
    ctx,
    logger,
  );
}, 60000);

test('errors when older version passed', async () => {
  await UpgradeTestingMethods.errorsWhenOlderVersionPassed(
    upgrade,
    olderVersion,
    lessOlderVersion,
    ctx,
    currentVersion,
    logger,
  );
}, 60000);

test('warns when dependency upgrade version is in semver range', async () => {
  await UpgradeTestingMethods.warnsWhenDependencyInSemverRange(
    upgrade,
    currentVersion,
    ctx,
    logger,
  );
}, 60000);

test('fetches empty patch and installs deps', async () => {
  await UpgradeTestingMethods.fetchesEmptyPatchAndInstallsDeps(
    mockFetch,
    upgrade,
    newVersion,
    ctx,
    flushOutput,
  );
}, 60000);

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote,', async () => {
  await UpgradeTestingMethods.fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote(
    mockFetch,
    samplePatch,
    upgrade,
    newVersion,
    merge,
    ctx,
    flushOutput,
    snapshotDiff,
    fs,
  );
}, 60000);

test('fetches regular patch, adds remote, applies patch, installs deps, removes remote when updated from nested directory', async () => {
  await UpgradeTestingMethods.fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested(
    samplePatch,
    mockFetch,
    execa,
    mockExecaNested,
    ctx,
    upgrade,
    newVersion,
    flushOutput,
  );
}, 60000);

test('cleans up if patching fails,', async () => {
  await UpgradeTestingMethods.cleansUpIfPatchingFails(
    mockFetch,
    samplePatch,
    execa,
    mockPushLog,
    upgrade,
    newVersion,
    ctx,
    flushOutput,
  );
}, 60000);

test('works with --name-ios and --name-android', async () => {
  await UpgradeTestingMethods.worksWithNameIosAndNameAndroid(
    mockFetch,
    samplePatch,
    upgrade,
    newVersion,
    merge,
    ctx,
    snapshotDiff,
    fs,
  );
}, 60000);
