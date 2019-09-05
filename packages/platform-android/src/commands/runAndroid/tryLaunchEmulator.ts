import execa from 'execa';
import Adb from './adb';

const getEmulators = () => {
  try {
    const emulatorsOutput = execa.sync('emulator', ['-list-avds']).stdout;
    return emulatorsOutput.split('\n').filter(name => name !== '');
  } catch {
    return [];
  }
};

const launchEmulator = async (emulatorName: string, adbPath: string) => {
  return new Promise((resolve, reject) => {
    const cp = execa('emulator', [`@${emulatorName}`], {
      detached: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const timeout = 30;

    // Reject command after timeout
    const rejectTimeout = setTimeout(() => {
      cleanup();
      reject(`Could not start emulator within ${timeout} seconds.`);
    }, timeout * 1000);

    // When emulator is started from snapshot, it does not emit boot completed message.
    // It starts immediately so we can check if device is present after some short delay
    const snapshotStartTimeout = setTimeout(() => {
      if (Adb.getDevices(adbPath).length > 0) {
        cleanup();
        resolve();
      }
    }, 5000);

    const cleanup = () => {
      clearTimeout(rejectTimeout);
      clearTimeout(snapshotStartTimeout);
      cp.stdout.destroy();
    };

    cp.unref();

    cp.stdout.addListener('data', message => {
      if (message.toString().includes('boot completed')) {
        cleanup();
        resolve();
      }
    });

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

export default async function tryLaunchEmulator(
  adbPath: string,
): Promise<{success: boolean; error?: string}> {
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
}
