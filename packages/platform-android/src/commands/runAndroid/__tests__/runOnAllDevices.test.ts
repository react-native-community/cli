/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import runOnAllDevices from '../runOnAllDevices';
import execa from 'execa';
import {Flags} from '..';
import {AndroidProjectConfig} from '@react-native-community/cli-types';

jest.mock('execa');
jest.mock('../getAdbPath');
jest.mock('../tryLaunchEmulator');

describe('--appFolder', () => {
  const args: Flags = {
    appId: '',
    tasks: undefined,
    variant: 'debug',
    appIdSuffix: '',
    mainActivity: 'MainActivity',
    deviceId: undefined,
    packager: true,
    port: 8081,
    terminal: 'iTerm2',
    jetifier: true,
    activeArchOnly: false,
  };
  const androidProject: AndroidProjectConfig = {
    appName: 'app',
    packageName: 'com.test',
    sourceDir: '/android',
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses task "install[Variant]" as default task', async () => {
    await runOnAllDevices(
      {...args, variant: 'debug'},
      './gradlew',
      'adb',
      androidProject,
    );
    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'app:installDebug',
    );
  });

  it('uses appName and default variant', async () => {
    await runOnAllDevices({...args, variant: 'debug'}, './gradlew', 'adb', {
      ...androidProject,
      appName: 'someApp',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'someApp:installDebug',
    );
  });

  it('uses appName and custom variant', async () => {
    await runOnAllDevices({...args, variant: 'staging'}, './gradlew', 'adb', {
      ...androidProject,
      appName: 'anotherApp',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'anotherApp:installStaging',
    );
  });

  it('uses only task argument', async () => {
    await runOnAllDevices(
      {...args, tasks: ['someTask']},
      './gradlew',
      'adb',
      androidProject,
    );

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'app:someTask',
    );
  });

  it('uses appName and custom task argument', async () => {
    await runOnAllDevices({...args, tasks: ['someTask']}, './gradlew', 'adb', {
      ...androidProject,
      appName: 'anotherApp',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'anotherApp:someTask',
    );
  });

  it('uses multiple tasks', async () => {
    await runOnAllDevices(
      {...args, tasks: ['clean', 'someTask']},
      './gradlew',
      'adb',
      androidProject,
    );

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toEqual([
      'app:clean',
      'app:someTask',
      '-PreactNativeDevServerPort=8081',
    ]);
  });
});
