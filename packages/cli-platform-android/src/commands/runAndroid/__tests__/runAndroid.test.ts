import path from 'path';
import {Config} from '@react-native-community/cli-types';
import runAndroid, {Flags} from '..';
import runOnAllDevices from '../runOnAllDevices';

jest.mock('../runOnAllDevices');
jest.mock('../getAdbPath');
jest.mock('@react-native-community/cli-config-android', () => ({
  getAndroidProject: () => ({sourceDir: 'sourceDir', appName: 'app'}),
}));

describe('run-android', () => {
  it('runs gradlew.bat by its full path on Windows', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', {value: 'win32'});
    const chdir = jest.spyOn(process, 'chdir').mockImplementation(() => {});
    const args = {mode: 'debug', packager: false, port: 8081} as Flags;
    try {
      await runAndroid.func(
        [],
        {reactNativeVersion: 'unknown'} as unknown as Config,
        args,
      );
    } finally {
      Object.defineProperty(process, 'platform', platform);
      chdir.mockRestore();
    }

    expect(runOnAllDevices).toHaveBeenCalledWith(
      args,
      path.join('sourceDir', 'gradlew.bat'),
      undefined,
      {sourceDir: 'sourceDir', appName: 'app'},
    );
  });
});
