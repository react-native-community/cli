import {AndroidProjectConfig} from '@react-native-community/cli-types';
import tryLaunchAppOnDevice from '../tryLaunchAppOnDevice';
import {Flags} from '..';
import execa from 'execa';

jest.mock('execa');
jest.mock('../getAdbPath');
jest.mock('../tryLaunchEmulator');

const adbPath = 'path/to/adb';
const device = 'emulator-5554';
let args: Flags = {
  activeArchOnly: false,
  packager: true,
  port: 8081,
  terminal: 'iTerm.app',
  appId: '',
  appIdSuffix: '',
  listDevices: false,
};

let androidProject: AndroidProjectConfig = {
  sourceDir: '/Users/thymikee/Developer/tmp/App73/android',
  appName: 'app',
  packageName: 'com.myapp',
  applicationId: 'com.myapp.custom',
  mainActivity: '.MainActivity',
  dependencyConfiguration: undefined,
  watchModeCommandParams: undefined,
};

const shellStartCommand = ['shell', 'am', 'start'];
const actionCategoryFlags = [
  '-a',
  'android.intent.action.MAIN',
  '-c',
  'android.intent.category.LAUNCHER',
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('launches adb shell with intent to launch com.myapp.MainActivity with different appId than packageName on a simulator', () => {
  tryLaunchAppOnDevice(device, androidProject, adbPath, args);

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      '-s',
      'emulator-5554',
      ...shellStartCommand,
      '-n',
      'com.myapp.custom/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('launches adb shell with intent to launch com.myapp.MainActivity with different appId than packageName on a simulator when mainActivity is fully qualified name', () => {
  tryLaunchAppOnDevice(
    device,
    {...androidProject, mainActivity: 'com.myapp.MainActivity'},
    adbPath,
    args,
  );

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      '-s',
      'emulator-5554',
      ...shellStartCommand,
      '-n',
      'com.myapp.custom/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('launches adb shell with intent to launch com.myapp.MainActivity with same appId as packageName on a simulator', () => {
  tryLaunchAppOnDevice(
    device,
    {...androidProject, applicationId: 'com.myapp'},
    adbPath,
    args,
  );

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      '-s',
      'emulator-5554',
      ...shellStartCommand,
      '-n',
      'com.myapp/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('launches adb shell with intent to launch com.myapp.MainActivity with different appId than packageName on a device (without calling simulator)', () => {
  tryLaunchAppOnDevice(undefined, androidProject, adbPath, args);

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      ...shellStartCommand,
      '-n',
      'com.myapp.custom/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('launches adb shell with intent to launch fully specified activity with different appId than packageName and an app suffix on a device', () => {
  tryLaunchAppOnDevice(
    device,
    {
      ...androidProject,
      mainActivity: 'com.zoontek.rnbootsplash.RNBootSplashActivity',
    },
    adbPath,
    {
      ...args,
      appIdSuffix: 'dev',
    },
  );

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      '-s',
      'emulator-5554',
      ...shellStartCommand,
      '-n',
      'com.myapp.custom.dev/com.zoontek.rnbootsplash.RNBootSplashActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('--appId flag overwrites applicationId setting in androidProject', () => {
  tryLaunchAppOnDevice(undefined, androidProject, adbPath, {
    ...args,
    appId: 'my.app.id',
  });

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      ...shellStartCommand,
      '-n',
      'my.app.id/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});

test('appIdSuffix Staging is appended to applicationId', () => {
  tryLaunchAppOnDevice(undefined, androidProject, adbPath, {
    ...args,
    appIdSuffix: 'Staging',
  });

  expect(execa.sync).toHaveBeenCalledWith(
    'path/to/adb',
    [
      ...shellStartCommand,
      '-n',
      'com.myapp.custom.Staging/com.myapp.MainActivity',
      ...actionCategoryFlags,
    ],
    {stdio: 'inherit'},
  );
});
