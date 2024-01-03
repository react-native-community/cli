import child_process from 'child_process';
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

  child_process.execFileSync('open', [
    `${activeDeveloperDir}/Applications/Simulator.app`,
    '--args',
    '-CurrentDeviceUDID',
    simulator.udid,
  ]);

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
    buildOutput,
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
