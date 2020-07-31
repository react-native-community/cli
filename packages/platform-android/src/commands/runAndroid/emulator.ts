import os from 'os';
import execa from 'execa';
import Adb from './adb';

const emulatorCommand = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/emulator/emulator`
  : 'emulator';

const getEmulators = () => {
  try {
    const emulatorsOutput = execa.sync(emulatorCommand, ['-list-avds']).stdout;
    return emulatorsOutput.split(os.EOL).filter(name => name !== '');
  } catch {
    return [];
  }
};

export const launchEmulator = async (emulatorName: string, adbPath: string) => {
  return new Promise((resolve, reject) => {
    const devicesList = Adb.getDevices(adbPath);

    const cp = execa(emulatorCommand, [`@${emulatorName}`], {
      detached: true,
      stdio: 'ignore',
    });
    cp.unref();
    const timeout = 30;

    // Reject command after timeout
    const rejectTimeout = setTimeout(() => {
      cleanup();
      reject(`Could not start emulator within ${timeout} seconds.`);
    }, timeout * 1000);

    const bootCheckInterval = setInterval(() => {
      const latestDevicesList = Adb.getDevices(adbPath);
      const hasDevicesListChanged =
        latestDevicesList.filter(d => !devicesList.includes(d)).length > 0;

      if (hasDevicesListChanged) {
        cleanup();
        resolve();
      }
    }, 1000);

    const cleanup = () => {
      clearTimeout(rejectTimeout);
      clearInterval(bootCheckInterval);
    };

    cp.on('exit', () => {
      cleanup();
      reject('Emulator exited before boot.');
    });

    cp.on('error', error => {
      cleanup();
      reject(error.message);
    });
  });
};

export const tryLaunchEmulator = async (
  adbPath: string,
): Promise<{success: boolean; error?: string}> => {
  const emulators = getEmulators();
  if (emulators.length > 0) {
    try {
      await launchEmulator(emulators[0], adbPath);
      return {success: true};
    } catch (error) {
      return {success: false, error};
    }
  }
  return {
    success: false,
    error: 'No emulators found as an output of `emulator -list-avds`',
  };
};
