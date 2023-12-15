import child_process from 'child_process';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {FlagsT} from '.';
import {Device} from '../../types';
import {buildProject} from '../buildIOS/buildProject';
import {formattedDeviceName} from './matchingDevice';
import {getBuildPath} from './getBuildPath';

export async function runOnSimulator(
  xcodeProject: IOSProjectInfo,
  platform: string,
  mode: string,
  scheme: string,
  args: FlagsT,
  simulator: Device,
) {
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

  let buildOutput, appPath;
  if (!args.binaryPath) {
    buildOutput = await buildProject(
      xcodeProject,
      platform,
      simulator.udid,
      mode,
      scheme,
      args,
    );

    appPath = await getBuildPath(
      xcodeProject,
      mode,
      buildOutput,
      scheme,
      args.target,
    );
  } else {
    appPath = args.binaryPath;
  }

  logger.info(`Installing "${chalk.bold(appPath)} on ${simulator.name}"`);

  child_process.spawnSync(
    'xcrun',
    ['simctl', 'install', simulator.udid, appPath],
    {stdio: 'inherit'},
  );

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(`Launching "${chalk.bold(bundleID)}"`);

  const result = child_process.spawnSync('xcrun', [
    'simctl',
    'launch',
    simulator.udid,
    bundleID,
  ]);

  if (result.status === 0) {
    logger.success('Successfully launched the app on the simulator');
  } else {
    logger.error(
      'Failed to launch the app on simulator',
      result.stderr.toString(),
    );
  }
}

function bootSimulator(selectedSimulator: Device) {
  const simulatorFullName = formattedDeviceName(selectedSimulator);
  logger.info(`Launching ${simulatorFullName}`);

  child_process.spawnSync('xcrun', ['simctl', 'boot', selectedSimulator.udid]);
}
