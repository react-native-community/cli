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

const ctx = loadConfig();

const samplePatch = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, './sample.patch'), 'utf8');

let logs = [];
const mockPushLog = (...args) =>
  logs.push(args.map((x) => (Array.isArray(x) ? x.join(' ') : x)).join(' '));
const flushOutput = () => stripAnsi(logs.join('\n'));

const setup = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  fs.writeFileSync = jest.fn((filename) => mockPushLog('[fs] write', filename));
  fs.unlinkSync = jest.fn((...args) => mockPushLog('[fs] unlink', args));
  logs = [];
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaDefault);
  Object.defineProperty(process, 'platform', {
    value: 'darwin',
  });
};

const teardown = () => {
  fs.writeFileSync = jest.requireMock('fs').writeFileSync;
  fs.unlinkSync = jest.requireMock('fs').unlinkSync;
};

const usesLatestVersionWhenNonePassed = async (repoName) => {
  await upgrade.func([], ctx);
  expect(execa).toBeCalledWith('npm', ['info', repoName, 'version']);
};

const appliesPatchInCwdWhenNested = async (newVersion) => {
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
};

const errorsWhenInvalidVersionPassed = async () => {
  await upgrade.func(['next'], ctx);
  expect(logger.error).toBeCalledWith(
    'Provided version "next" is not allowed. Please pass a valid semver version',
  );
};

const errorsWhenOlderVersionPassed = async (
  olderVersion,
  lessOlderVersion,
  currentVersion,
) => {
  await upgrade.func([olderVersion], ctx);
  expect(logger.error).toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${olderVersion}"`,
  );
  await upgrade.func([lessOlderVersion], ctx);
  expect(logger.error).not.toBeCalledWith(
    `Trying to upgrade from newer version "${currentVersion}" to older "${lessOlderVersion}"`,
  );
};

const warnsWhenDependencyInSemverRange = async (currentVersion) => {
  await upgrade.func([currentVersion], ctx);
  expect(logger.warn).toBeCalledWith(
    `Specified version "${currentVersion}" is already installed in node_modules and it satisfies "^${currentVersion}" semver range. No need to upgrade`,
  );
};

const fetchesEmptyPatchAndInstallsDeps = async (newVersion) => {
  mockFetch();
  await upgrade.func([newVersion], ctx);
  expect(flushOutput()).toMatchSnapshot();
};

const fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote = async (
  newVersion,
) => {
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
  expect(flushOutput()).toMatchSnapshot();
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
};

const fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested = async (
  newVersion,
) => {
  mockFetch(samplePatch, 200);
  ((execa as unknown) as jest.Mock).mockImplementation(mockExecaNested);
  const config = {...ctx, root: '/project/root/NestedApp'};
  await upgrade.func([newVersion], config);
  expect(flushOutput()).toMatchSnapshot();
};

const cleansUpIfPatchingFails = async (newVersion) => {
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
  expect(flushOutput()).toMatchSnapshot();
};

const worksWithNameIosAndNameAndroid = async (newVersion) => {
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
};

export default {
  setup,
  teardown,
  usesLatestVersionWhenNonePassed,
  appliesPatchInCwdWhenNested,
  errorsWhenInvalidVersionPassed,
  errorsWhenOlderVersionPassed,
  warnsWhenDependencyInSemverRange,
  fetchesEmptyPatchAndInstallsDeps,
  fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemote,
  fetchesRegularPatchInstallRemoteAppliesPatchInstallsDepsRemovesRemoteNested,
  cleansUpIfPatchingFails,
  worksWithNameIosAndNameAndroid,
};
