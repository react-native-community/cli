import os from 'os';
import execa from 'execa';
import adb from './adb';

const emulatorCommand = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/emulator/emulator`
  : 'emulator';

export const getEmulators = () => {
  try {
    const emulatorsOutput = execa.sync(emulatorCommand, ['-list-avds']).stdout;
    return emulatorsOutput.split(os.EOL).filter((name) => name !== '');
  } catch {
    return [];
  }
};

const launchEmulator = async (
  emulatorName: string,
  adbPath: string,
  port?: number,
): Promise<boolean> => {
  const manualCommand = `${emulatorCommand} @${emulatorName}`;

  const cp = execa(
    emulatorCommand,
    [`@${emulatorName}`, port ? '-port' : '', port ? `${port}` : ''],
    {
      detached: true,
      stdio: 'ignore',
    },
  );
  cp.unref();
  const timeout = 30;

  return new Promise<boolean>((resolve, reject) => {
    const bootCheckInterval = setInterval(async () => {
      const devices = adb.getDevices(adbPath);
      const connected = port
        ? devices.find((d) => d.includes(`${port}`))
        : devices.length > 0;
      if (connected) {
        cleanup();
        resolve(true);
      }
    }, 1000);

    // Reject command after timeout
    const rejectTimeout = setTimeout(() => {
      stopWaitingAndReject(
        `It took too long to start and connect with Android emulator: ${emulatorName}. You can try starting the emulator manually from the terminal with: ${manualCommand}`,
      );
    }, timeout * 1000);

    const cleanup = () => {
      clearTimeout(rejectTimeout);
      clearInterval(bootCheckInterval);
    };

    const stopWaitingAndReject = (message: string) => {
      cleanup();
      reject(new Error(message));
    };

    cp.on('error', ({message}) => stopWaitingAndReject(message));

    cp.on('exit', () => {
      stopWaitingAndReject(
        `The emulator (${emulatorName}) quit before it finished opening. You can try starting the emulator manually from the terminal with: ${manualCommand}`,
      );
    });
  });
};

export default async function tryLaunchEmulator(
  adbPath: string,
  emulatorName?: string,
  port?: number,
): Promise<{success: boolean; error?: string}> {
  const emulators = getEmulators();
  if (emulators.length > 0) {
    try {
      await launchEmulator(emulatorName ?? emulators[0], adbPath, port);
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
