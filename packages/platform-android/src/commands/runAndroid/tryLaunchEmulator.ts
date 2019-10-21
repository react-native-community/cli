import execa from 'execa';
// @ts-ignore untyped
import inquirer from 'inquirer';
import Adb from './adb';

const emulatorCommand = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/emulator/emulator`
  : 'emulator';

const getEmulators = () => {
  try {
    const emulatorsOutput = execa.sync(emulatorCommand, ['-list-avds']).stdout;
    return emulatorsOutput.split('\n').filter(name => name !== '');
  } catch {
    return [];
  }
};

const launchEmulator = async (emulatorName: string, adbPath: string) => {
  return new Promise((resolve, reject) => {
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
      if (Adb.getDevices(adbPath).length > 0) {
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

async function chooseEmulator(emulators: Array<string>) {
  const {chosenEmulator} = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenEmulator',
      message:
        'Which emulator would you like to launch?\n(This behaviour can be avoided using the --no-interactive flag)',
      choices: [...emulators, 'All of them'],
    },
  ]);

  if (chosenEmulator === 'All of them') {
    return emulators;
  }

  return chosenEmulator;
}

export default async function tryLaunchEmulator(
  adbPath: string,
  interactive: boolean,
): Promise<{success: boolean; error?: string}> {
  const emulators = getEmulators();
  if (emulators.length > 0) {
    try {
      // Default value
      let emulatorOrEmulators = emulators[0];

      if (emulators.length > 1 && interactive) {
        emulatorOrEmulators = await chooseEmulator(emulators);
      }

      if (Array.isArray(emulatorOrEmulators)) {
        const promises = emulatorOrEmulators.map(emulator =>
          launchEmulator(emulator, adbPath),
        );

        await Promise.all(promises);
      } else {
        await launchEmulator(emulatorOrEmulators, adbPath);
      }

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
