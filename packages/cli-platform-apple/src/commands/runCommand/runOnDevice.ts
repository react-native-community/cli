import child_process from 'child_process';
import {ApplePlatform, Device} from '../../types';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {CLIError, logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {buildProject} from '../buildCommand/buildProject';
import {getBuildPath} from './getBuildPath';
import {FlagsT} from './createRun';

export async function runOnDevice(
  selectedDevice: Device,
  platform: ApplePlatform,
  mode: string,
  scheme: string,
  xcodeProject: IOSProjectInfo,
  args: FlagsT,
) {
  if (args.binaryPath && selectedDevice.type === 'catalyst') {
    throw new CLIError(
      'binary-path was specified for catalyst device, which is not supported.',
    );
  }

  const isIOSDeployInstalled = child_process.spawnSync(
    'ios-deploy',
    ['--version'],
    {encoding: 'utf8'},
  );

  if (isIOSDeployInstalled.error) {
    throw new CLIError(
      `Failed to install the app on the device because we couldn't execute the "ios-deploy" command. Please install it by running "${chalk.bold(
        'brew install ios-deploy',
      )}" and try again.`,
    );
  }

  if (selectedDevice.type === 'catalyst') {
    const buildOutput = await buildProject(
      xcodeProject,
      platform,
      selectedDevice.udid,
      mode,
      scheme,
      args,
    );

    const appPath = await getBuildPath(
      xcodeProject,
      mode,
      buildOutput,
      scheme,
      args.target,
      true,
    );
    const appProcess = child_process.spawn(`${appPath}/${scheme}`, [], {
      detached: true,
      stdio: 'ignore',
    });
    appProcess.unref();
  } else {
    let buildOutput, appPath;
    if (!args.binaryPath) {
      buildOutput = await buildProject(
        xcodeProject,
        platform,
        selectedDevice.udid,
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

    const iosDeployInstallArgs = [
      '--bundle',
      appPath,
      '--id',
      selectedDevice.udid,
      '--justlaunch',
    ];

    logger.info(`Installing and launching your app on ${selectedDevice.name}`);

    const iosDeployOutput = child_process.spawnSync(
      'ios-deploy',
      iosDeployInstallArgs,
      {encoding: 'utf8'},
    );

    if (iosDeployOutput.error) {
      throw new CLIError(
        `Failed to install the app on the device. We've encountered an error in "ios-deploy" command: ${iosDeployOutput.error.message}`,
      );
    }
  }

  return logger.success('Installed the app on the device.');
}
