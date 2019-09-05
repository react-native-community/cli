import {execFileSync, spawn} from 'child_process';
import Adb from './adb';

const getEmulators = () => {
  try {
    const emulatorsOutput = execFileSync('emulator', ['-list-avds']).toString();
    return emulatorsOutput.split('\n').filter(name => name !== '');
  } catch {
    return [];
  }
};

const launchEmulator = async (emulatorName: string, adbPath: string) => {
  return new Promise((resolve, reject) => {
    const cp = spawn('emulator', [`@${emulatorName}`], {
      detached: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    // Reject command after timeout
    const rejectTimeout = setTimeout(() => {
      cp.stdout.destroy();
      reject();
    }, 30 * 1000);

    // When emulator is started from snapshot, it does not emit boot completed message.
    // It starts immediately so we can check if device is present
    setTimeout(() => {
      if (Adb.getDevices(adbPath).length > 0) {
        resolve();
      }
    }, 5000);

    cp.unref();

    cp.stdout.addListener('data', message => {
      if (message.toString().indexOf('boot completed') >= 0) {
        clearTimeout(rejectTimeout);
        cp.stdout.destroy();
        resolve();
      }
    });

    cp.on('close', () => {
      reject();
    });
  });
};

export default async function tryLaunchEmulator(adbPath: string) {
  const emulators = getEmulators();
  if (emulators.length > 0) {
    try {
      await launchEmulator(emulators[0], adbPath);
      return true;
    } catch (e) {
      console.log('Emulator error', e);
    }
  }
  return false;
}
