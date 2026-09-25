import execa from 'execa';
import fs from 'fs';
import type {AndroidProject, Flags} from '..';
import adb from '../adb';
import tryInstallAppOnDevice from '../tryInstallAppOnDevice';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));
jest.mock('../adb');
jest.mock('../getAdbPath');
jest.mock('../tryLaunchEmulator');

const adbPath = 'path/to/adb';
const device = 'emulator-5554';

const androidProject: AndroidProject = {
  sourceDir: '/android',
  appName: 'app',
  packageName: 'com.myapp',
  applicationId: 'com.myapp',
  mainActivity: '.MainActivity',
  assets: [],
};

function flags(mode: string): Flags {
  return {
    activeArchOnly: false,
    packager: true,
    port: 8081,
    terminal: 'iTerm.app',
    appId: '',
    appIdSuffix: '',
    listDevices: true,
    mode,
  };
}

function apkDir(variantPath: string) {
  return `/android/app/build/outputs/apk/${variantPath}`;
}

function mockMetadata(
  buildDirectory: string,
  elements: Array<{
    outputFile: string;
    filters?: Array<{filterType: string; value: string}>;
  }>,
) {
  (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
    if (filePath === `${buildDirectory}/output-metadata.json`) {
      return JSON.stringify({elements});
    }
    throw new Error('ENOENT');
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (fs.existsSync as jest.Mock).mockReturnValue(false);
  (fs.readFileSync as jest.Mock).mockImplementation(() => {
    throw new Error('ENOENT');
  });
  (adb.getAvailableCPUs as jest.Mock).mockReturnValue(['arm64-v8a']);
});

test('installs camelCase flavor APK using AGP output-metadata.json', () => {
  const buildDirectory = apkDir('stagingInternal/debug');
  const apkName = 'app-stagingInternal-debug.apk';

  mockMetadata(buildDirectory, [{outputFile: apkName, filters: []}]);
  (fs.existsSync as jest.Mock).mockImplementation(
    (filePath: string) => filePath === `${buildDirectory}/${apkName}`,
  );

  tryInstallAppOnDevice(
    flags('stagingInternalDebug'),
    adbPath,
    device,
    androidProject,
  );

  expect(execa.sync).toHaveBeenCalledWith(
    adbPath,
    ['-s', device, 'install', '-r', '-d', `${buildDirectory}/${apkName}`],
    {stdio: 'inherit'},
  );
});

test('prefers an ABI split matching the device over metadata order', () => {
  const buildDirectory = apkDir('stagingInternal/debug');
  const preferred = 'app-arm64-v8a-stagingInternal-debug.apk';
  const other = 'app-armeabi-v7a-stagingInternal-debug.apk';

  (adb.getAvailableCPUs as jest.Mock).mockReturnValue([
    'arm64-v8a',
    'armeabi-v7a',
  ]);
  mockMetadata(buildDirectory, [
    {
      outputFile: other,
      filters: [{filterType: 'ABI', value: 'armeabi-v7a'}],
    },
    {
      outputFile: preferred,
      filters: [{filterType: 'ABI', value: 'arm64-v8a'}],
    },
  ]);
  (fs.existsSync as jest.Mock).mockImplementation(
    (filePath: string) =>
      filePath === `${buildDirectory}/${preferred}` ||
      filePath === `${buildDirectory}/${other}`,
  );

  tryInstallAppOnDevice(
    flags('stagingInternalDebug'),
    adbPath,
    device,
    androidProject,
  );

  expect(execa.sync).toHaveBeenCalledWith(
    adbPath,
    ['-s', device, 'install', '-r', '-d', `${buildDirectory}/${preferred}`],
    {stdio: 'inherit'},
  );
});

test('falls back to the hyphenated filename when metadata is absent', () => {
  const buildDirectory = apkDir('acmeStaging/debug');
  const apkName = 'app-acme-staging-debug.apk';

  (fs.existsSync as jest.Mock).mockImplementation(
    (filePath: string) => filePath === `${buildDirectory}/${apkName}`,
  );

  tryInstallAppOnDevice(
    flags('acmeStagingDebug'),
    adbPath,
    device,
    androidProject,
  );

  expect(execa.sync).toHaveBeenCalledWith(
    adbPath,
    ['-s', device, 'install', '-r', '-d', `${buildDirectory}/${apkName}`],
    {stdio: 'inherit'},
  );
});

test('throws when no matching APK is present', () => {
  expect(() =>
    tryInstallAppOnDevice(flags('debug'), adbPath, device, androidProject),
  ).toThrow('Failed to install the app on the device.');
});
