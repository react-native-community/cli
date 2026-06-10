import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import {ApplePlatform, Device} from '../../types';
import {buildProject} from '../buildCommand/buildProject';
import {formattedDeviceName} from './matchingDevice';
import {FlagsT} from './createRun';
import installApp from './installApp';

export async function runOnSimulator(
  xcodeProject: IOSProjectInfo,
  platform: ApplePlatform,
  mode: string,
  scheme: string,
  args: FlagsT,
  simulator: Device,
) {
  const {binaryPath, target} = args;

  /**
   * Booting simulator through `xcrun simctl boot` will boot it in the `headless` mode
   * (running in the background).
   *
   * In order for user to see the app and the simulator itself, we have to make sure
   * that the Simulator.app is running.
   *
   * We also pass it `-CurrentDeviceUDID` so that when we launch it for the first time,
   * it will not boot the "default" device, but the one we set. If the app is already running,
   * this flag has no effect.
   */
  const activeDeveloperDir = child_process
    .execFileSync('xcode-select', ['-p'], {encoding: 'utf8'})
    .trim();

  // Xcode 27 replaces Simulator.app with DeviceHub.app and relocates it from
  // <Xcode>/Contents/Developer/Applications to <Xcode>/Contents/Applications.
  // Prefer Simulator.app while it exists (stable Xcode); fall back to DeviceHub
  // for Xcode 27+. See https://developer.apple.com/documentation/xcode/device-hub
  const simulatorApp = path.join(
    activeDeveloperDir,
    'Applications',
    'Simulator.app',
  );
  const deviceHubApp = path.join(
    activeDeveloperDir,
    '..',
    'Applications',
    'DeviceHub.app',
  );

  if (fs.existsSync(simulatorApp)) {
    child_process.execFileSync('open', [
      simulatorApp,
      '--args',
      '-CurrentDeviceUDID',
      simulator.udid,
    ]);
  } else if (fs.existsSync(deviceHubApp)) {
    // DeviceHub gives us no way to focus a specific device, so we open it
    // without the -CurrentDeviceUDID argument.
    child_process.execFileSync('open', [deviceHubApp]);
  }

  if (simulator.state !== 'Booted') {
    bootSimulator(simulator);
  }

  let buildOutput;
  if (!binaryPath) {
    buildOutput = await buildProject(
      xcodeProject,
      platform,
      simulator.udid,
      mode,
      scheme,
      args,
    );
  }

  installApp({
    buildOutput: buildOutput ?? '',
    xcodeProject,
    mode,
    scheme,
    target,
    udid: simulator.udid,
    binaryPath,
  });
}

function bootSimulator(selectedSimulator: Device) {
  const simulatorFullName = formattedDeviceName(selectedSimulator);
  logger.info(`Launching ${simulatorFullName}`);

  child_process.spawnSync('xcrun', ['simctl', 'boot', selectedSimulator.udid]);
}
