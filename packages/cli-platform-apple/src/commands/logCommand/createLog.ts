import {CLIError, logger} from '@react-native-community/cli-tools';
import {Config, IOSProjectConfig} from '@react-native-community/cli-types';
import {spawnSync} from 'child_process';
import os from 'os';
import path from 'path';
import listDevices from '../../tools/listDevices';
import {getPlatformInfo} from '../runCommand/getPlatformInfo';
import {BuilderCommand, Device} from '../../types';
import {supportedPlatforms} from '../../config/supportedPlatforms';
import {promptForDeviceToTailLogs} from '../../tools/prompts';

/**
 * Starts Apple device syslog tail
 */

type Args = {
  interactive: boolean;
};

const createLog =
  ({platformName}: BuilderCommand) =>
  async (_: Array<string>, ctx: Config, args: Args) => {
    const platformConfig = ctx.project[platformName] as IOSProjectConfig;
    const {readableName: platformReadableName} = getPlatformInfo(platformName);

    if (
      platformConfig === undefined ||
      supportedPlatforms[platformName] === undefined
    ) {
      throw new CLIError(`Unable to find ${platformName} platform config`);
    }

    const {sdkNames} = getPlatformInfo(platformName);
    const allDevices = await listDevices(sdkNames);
    const simulators = allDevices.filter(({type}) => type === 'simulator');

    if (simulators.length === 0) {
      logger.error('No simulators detected. Install simulators via Xcode.');
      return;
    }

    const booted = simulators.filter(({state}) => state === 'Booted');

    if (booted.length === 0) {
      logger.error(
        `No booted and available ${platformReadableName} simulators found.`,
      );
      return;
    }

    if (args.interactive && booted.length > 1) {
      const udid = await promptForDeviceToTailLogs(
        platformReadableName,
        booted,
      );

      const simulator = booted.find(
        ({udid: deviceUDID}) => deviceUDID === udid,
      );

      if (!simulator) {
        throw new CLIError(
          `Unable to find simulator with udid: ${udid} in booted simulators`,
        );
      }

      tailDeviceLogs(simulator);
    } else {
      tailDeviceLogs(booted[0]);
    }
  };

function tailDeviceLogs(device: Device) {
  const logDir = path.join(
    os.homedir(),
    'Library',
    'Logs',
    'CoreSimulator',
    device.udid,
    'asl',
  );

  logger.info(`Tailing logs for device ${device.name} (${device.udid})`);

  const log = spawnSync('syslog', ['-w', '-F', 'std', '-d', logDir], {
    stdio: 'inherit',
  });

  if (log.error !== null) {
    throw log.error;
  }
}

export default createLog;
