import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';
import {AndroidProjectConfig} from '@react-native-community/cli-types';
import adb from '../adb';
import tryInstallAppOnDevice from '../tryInstallAppOnDevice';
import {Flags} from '..';

jest.mock('execa');

let root: string;
let buildDirectory: string;
let project: AndroidProjectConfig;
const device = 'emulator-5554';
const adbPath = 'path/to/adb';
const args: Flags = {
  mode: 'clientStagingDebug',
  activeArchOnly: false,
  packager: false,
  port: 8081,
  terminal: '',
  appId: '',
  appIdSuffix: '',
  listDevices: false,
};

function apk(name: string) {
  fs.writeFileSync(path.join(buildDirectory, name), 'unit-test APK');
  return name;
}

function metadata(elements: unknown) {
  fs.writeFileSync(
    path.join(buildDirectory, 'output-metadata.json'),
    JSON.stringify({version: 3, variantName: 'clientStagingDebug', elements}),
  );
}

function output(outputFile: string, abi?: string) {
  return {
    outputFile,
    filters: abi ? [{filterType: 'ABI', value: abi}] : [],
  };
}

function expectInstalled(name: string, user?: number) {
  const calls = (execa.sync as jest.Mock).mock.calls;
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe(adbPath);
  expect(calls[0][1].slice(0, -1)).toEqual([
    '-s',
    device,
    'install',
    '-r',
    '-d',
    ...(user === undefined ? [] : ['--user', String(user)]),
  ]);
  expect(path.normalize(calls[0][1].slice(-1)[0])).toBe(
    path.join(buildDirectory, name),
  );
  expect(calls[0][2]).toEqual({stdio: 'inherit'});
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .spyOn(adb, 'getAvailableCPUs')
    .mockReturnValue(['arm64-v8a', 'armeabi-v7a']);
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-apk-test-'));
  project = {
    sourceDir: path.join(root, 'android project'),
    appName: 'app',
    packageName: 'com.example',
    applicationId: 'com.example',
    mainActivity: '.MainActivity',
  };
  buildDirectory = path.join(
    project.sourceDir,
    project.appName,
    'build/outputs/apk/clientStaging/debug',
  );
  fs.mkdirSync(buildDirectory, {recursive: true});
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(root, {recursive: true, force: true});
});

test.each(['app-clientStaging-debug.apk', 'app-client-staging-debug.apk'])(
  'uses metadata to distinguish one flavor from multiple dimensions: %s',
  (name) => {
    apk('app-clientStaging-debug.apk');
    apk('app-client-staging-debug.apk');
    metadata([output(name)]);
    tryInstallAppOnDevice(args, adbPath, device, project);
    expectInstalled(name);
  },
);

test('installs a custom output filename and preserves the requested user', () => {
  metadata([output(apk('custom build.apk'))]);
  tryInstallAppOnDevice({...args, user: 0}, adbPath, device, project);
  expectInstalled('custom build.apk', 0);
});

test('prefers the device ABI order over metadata order and the universal output', () => {
  metadata([
    output(apk('universal.apk')),
    output(apk('arm32.apk'), 'armeabi-v7a'),
    output(apk('arm64.apk'), 'arm64-v8a'),
  ]);
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('arm64.apk');
});

test('skips a missing preferred ABI file and tries the next compatible output', () => {
  metadata([
    output('missing.apk', 'arm64-v8a'),
    output(apk('arm32.apk'), 'armeabi-v7a'),
    output(apk('universal.apk')),
  ]);
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('arm32.apk');
});

test('uses the unfiltered output when ABI splits do not match the device', () => {
  metadata([output(apk('intel.apk'), 'x86_64'), output(apk('universal.apk'))]);
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('universal.apk');
});

test('accepts an output with omitted filters', () => {
  metadata([{outputFile: apk('single.apk')}]);
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('single.apk');
});

test.each([
  null,
  'not an array',
  [null, 42, {}, {outputFile: 12}],
  [
    {
      outputFile: 'density.apk',
      filters: [{filterType: 'DENSITY', value: 'mdpi'}],
    },
  ],
  [{outputFile: 'density.apk', filters: 'invalid'}],
  [{outputFile: 'density.apk', filters: [null]}],
  [{outputFile: 'missing.apk'}],
])('falls back to existing names for unusable metadata: %j', (elements) => {
  apk('density.apk');
  apk('app-client-staging-debug.apk');
  metadata(elements);
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('app-client-staging-debug.apk');
});

test('falls back when metadata is malformed JSON', () => {
  apk('app-client-staging-debug.apk');
  fs.writeFileSync(path.join(buildDirectory, 'output-metadata.json'), '{');
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('app-client-staging-debug.apk');
});

test('retains ABI filename preference when metadata is absent', () => {
  apk('app-armeabi-v7a-client-staging-debug.apk');
  apk('app-arm64-v8a-client-staging-debug.apk');
  apk('app-universal-client-staging-debug.apk');
  tryInstallAppOnDevice(args, adbPath, device, project);
  expectInstalled('app-arm64-v8a-client-staging-debug.apk');
});

test('retains the missing APK error', () => {
  metadata([output('missing.apk')]);
  expect(() => tryInstallAppOnDevice(args, adbPath, device, project)).toThrow(
    'Failed to install the app on the device.',
  );
  expect(execa.sync).not.toHaveBeenCalled();
});

test('an explicit binary path bypasses discovery', () => {
  const binaryPath = path.join(root, 'chosen.apk');
  tryInstallAppOnDevice({...args, binaryPath}, adbPath, device, project);
  expect(adb.getAvailableCPUs).not.toHaveBeenCalled();
  expect((execa.sync as jest.Mock).mock.calls[0][1].slice(-1)).toEqual([
    binaryPath,
  ]);
});
