import child_process from 'child_process';
import {ApplePlatform, Device} from '../../types';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {buildProject} from '../buildCommand/buildProject';
import {getBuildPath} from './getBuildPath';
import {FlagsT} from './createRun';
import {getBuildSettings} from './getBuildSettings';
import installApp from './installApp';

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

  if (selectedDevice.type === 'catalyst') {
    const buildOutput = await buildProject(
      xcodeProject,
      platform,
      selectedDevice.udid,
      mode,
      scheme,
      args,
    );

    const buildSettings = await getBuildSettings(
      xcodeProject,
      mode,
      buildOutput,
      scheme,
    );

    if (!buildSettings) {
      throw new CLIError('Failed to get build settings for your project');
    }

    const appPath = await getBuildPath(buildSettings, platform, true);
    const appProcess = child_process.spawn(`${appPath}/${scheme}`, [], {
      detached: true,
      stdio: 'ignore',
    });
    appProcess.unref();
  } else {
    const {binaryPath, target} = args;

    let buildOutput;
    if (!binaryPath) {
      buildOutput = await buildProject(
        xcodeProject,
        platform,
        selectedDevice.udid,
        mode,
        scheme,
        args,
      );
    }

    logger.info(`Installing and launching your app on ${selectedDevice.name}`);

    installApp({
      buildOutput: buildOutput ?? '',
      xcodeProject,
      mode,
      scheme,
      target,
      udid: selectedDevice.udid,
      binaryPath,
      isSimulator: false,
    });
  }

  return logger.success('Installed the app on the device.');
}
