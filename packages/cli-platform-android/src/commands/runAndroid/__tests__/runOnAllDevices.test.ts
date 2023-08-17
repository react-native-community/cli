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

const gradleTaskOutput = `
> Task :tasks

------------------------------------------------------------
Tasks runnable from root project 'Bar'
------------------------------------------------------------

Android tasks
-------------
androidDependencies - Displays the Android dependencies of the project.
signingReport - Displays the signing info for the base and test modules
sourceSets - Prints out all the source sets defined in this project.

Build tasks
-----------
assemble - Assemble main outputs for all the variants.
assembleAndroidTest - Assembles all the Test applications.
assembleDebug - Assembles main outputs for all Debug variants.
assembleRelease - Assembles main outputs for all Release variants.
build - Assembles and tests this project.
buildDependents - Assembles and tests this project and all projects that depend on it.
buildNeeded - Assembles and tests this project and all projects it depends on.
bundle - Assemble bundles for all the variants.
bundleDebug - Assembles bundles for all Debug variants.
bundleRelease - Assembles bundles for all Release variants.


Install tasks
-------------
installDebug - Installs the Debug build.
installDebugAndroidTest - Installs the android (on device) tests for the Debug build.
installRelease - Installs the Release build.
uninstallAll - Uninstall all applications.
`;

jest.mock('execa');
jest.mock('../getAdbPath');
jest.mock('../tryLaunchEmulator');

describe('--appFolder', () => {
  const args: Flags = {
    appId: '',
    tasks: undefined,
    mode: 'debug',
    appIdSuffix: '',
    mainActivity: 'MainActivity',
    deviceId: undefined,
    packager: true,
    port: 8081,
    terminal: 'iTerm2',
    activeArchOnly: false,
  };
  const androidProject: AndroidProjectConfig = {
    appName: 'app',
    packageName: 'com.test',
    sourceDir: '/android',
    mainActivity: '.MainActivity',
  };
  beforeEach(() => {
    jest.clearAllMocks();
    (execa.sync as jest.Mock).mockReturnValueOnce({stdout: gradleTaskOutput});
  });

  it('uses task "install[Variant]" as default task', async () => {
    await runOnAllDevices(
      {...args, mode: 'debug'},
      './gradlew',
      'adb',
      androidProject,
    );
    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'app:installDebug',
    );
  });

  it('uses appName and default variant', async () => {
    await runOnAllDevices({...args, mode: 'debug'}, './gradlew', 'adb', {
      ...androidProject,
      appName: 'someApp',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'someApp:installDebug',
    );
  });

  it('uses appName and custom variant', async () => {
    await runOnAllDevices({...args, mode: 'release'}, './gradlew', 'adb', {
      ...androidProject,
      appName: 'anotherApp',
    });

    expect(((execa as unknown) as jest.Mock).mock.calls[0][1]).toContain(
      'anotherApp:installRelease',
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
