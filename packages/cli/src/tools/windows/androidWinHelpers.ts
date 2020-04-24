import {join} from 'path';
import {executeCommand} from './executeWinCommand';
import {getProcessorType} from '../processorType';

type HypervisorStatus = {
  hypervisor: 'WHPX' | 'HAXM' | 'AMDH' | 'none';
  installed: boolean;
};

/**
 * Returns the path to where all Android related things should be installed
 * locally to the user.
 */
export const getUserAndroidPath = () => {
  return join(process.env.LOCALAPPDATA || '', 'Android');
};

/**
 * Deals with ANDROID_HOME, ANDROID_SDK_ROOT or generates a new one
 */
export const getAndroidSdkRootInstallation = () => {
  // TODO: Check if the path exists?
  const env = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  const installPath = env
    ? // Happens if previous installations or not fully completed
      env
    : // All Android zip files have a root folder, using `Android` as the common place
      join(getUserAndroidPath(), 'Sdk');

  return installPath;
};

/**
 * Installs an Android component (e.g.: `platform-tools`, `emulator`)
 * using the `sdkmanager` tool and automatically accepting the licenses.
 */
export const installComponent = (component: string, androidSdkRoot: string) => {
  return new Promise((done, error) => {
    const sdkmanager = join(androidSdkRoot, 'tools', 'bin', 'sdkmanager.bat');

    const command = `"${sdkmanager}" --sdk_root="${androidSdkRoot}" "${component}"`;

    const child = executeCommand(command);
    let stderr = '';

    child.stdout.on('data', data => {
      if (data.includes('(y/N)')) {
        child.stdin.write('y\n');
      }
    });

    child.stderr.on('data', data => {
      stderr += data.toString('utf-8');
    });

    child.on('close', data => {
      if (data === 0) {
        done();
      } else {
        error({stderr});
      }
    });
    child.on('error', error);
  });
};

/**
 * For the given custom Hypervisor and the output of `emulator-check accel`
 * returns the preferred Hypervisor to use and its installation status.
 * The recommendation order is:
 * 1. WHPX
 * 2. HAXM if Intel
 * 3. AMDH if AMD
 */
const parseHypervisor = (
  status: string,
  customHypervisor: 'HAXM' | 'AMDH',
): HypervisorStatus | null => {
  /**
   * Messages (haven't checked with AMD devices):
   * HAXM is not installed, but Windows Hypervisor Platform is available.
   * WHPX (10.0.19041) is installed and usable.
   * HAXM version 6.2.1 (4) is installed and usable.
   * HAXM is not installed on this machine
   */

  if (
    status.includes(
      'is not installed, but Windows Hypervisor Platform is available.',
    )
  ) {
    return {
      hypervisor: 'WHPX',
      installed: false,
    };
  }

  if (/WHPX \((\d|\.)+\) is installed and usable\./.test(status)) {
    return {
      hypervisor: 'WHPX',
      installed: true,
    };
  }

  if (/is installed and usable\./.test(status)) {
    return {
      hypervisor: customHypervisor,
      installed: true,
    };
  }

  if (status.includes('is not installed on this machine')) {
    return {
      hypervisor: 'none',
      installed: false,
    };
  }

  return null;
};

const getEmulatorAccelOutputInformation = async (androidSDKRoot: string) => {
  /**
   * The output of the following command is something like:
   *
   * ```
   * accel:
   * 0
   * WHPX (10.0.19041) is installed and usable.
   * accel
   * ```
   *
   * If it fails it will still output to stdout with a similar format:
   *
   * ```
   * accel:
   * 1
   * Android Emulator does not support nested virtualization.  Your VM host: 'Microsoft Hv' (Hyper-V)
   * accel
   * ```
   *
   */

  try {
    const {stdout} = await executeCommand(
      `"${join(androidSDKRoot, 'emulator', 'emulator-check.exe')}" accel`,
    );

    return stdout;
  } catch (e) {
    const {stdout} = e;

    return stdout;
  }
};

/**
 * Returns what hypervisor should be installed for the Android emulator
 * using [Microsoft's official
 * documentation](https://docs.microsoft.com/en-us/xamarin/android/get-started/installation/android-emulator/hardware-acceleration?pivots=windows)
 * as a reference.
 */
export const getBestHypervisor = async (
  androidSDKRoot: string,
): Promise<HypervisorStatus> => {
  // Should be in the path? might want to pass the root before
  const customHypervisor = getProcessorType() === 'Intel' ? 'HAXM' : 'AMDH';

  const stdout = await getEmulatorAccelOutputInformation(androidSDKRoot);

  const lines = stdout.split('\n');

  for (const line of lines) {
    const hypervisor = parseHypervisor(line, customHypervisor);

    if (hypervisor) {
      return hypervisor;
    }
  }

  // Couldn't identify the best one to run so not doing anything
  return {
    hypervisor: 'none',
    installed: false,
  };
};

export const enableWHPX = () => {
  // Need to prompt for UAC
  return executeCommand(
    'DISM /Quiet /NoRestart /Online /Enable-Feature /All /FeatureName:Microsoft-Hyper-V /FeatureName:HypervisorPlatform',
    true,
  );
};

export const enableHAXM = async (installPath: string) => {
  // Install from sdkmanager
  await installComponent(
    'extras;intel;Hardware_Accelerated_Execution_Manager',
    installPath,
  );

  /*
    Do something with the return codes? From the docs:

    In case of success:
      Return 0 to caller
    In case of fail:
      Return 1 to caller
    In case of HAXM is already installed:
      HAXM will be upgraded automatically.
    In case the machines needs to reboot after install/update:
      Return 2 to caller.
  */
  await executeCommand(
    join(
      installPath,
      'Sdk',
      'extras',
      'intel',
      'Hardware_Accelerated_Execution_Manager',
      'silent_install.bat',
    ),
  );
};

export const enableAMDH = async (installPath: string) => {
  await installComponent(
    'extras;google;Android_Emulator_Hypervisor_Driver',
    installPath,
  );

  await executeCommand(
    join(
      installPath,
      'Sdk',
      'extras',
      'google',
      'Android_Emulator_Hypervisor_Driver',
      'silent_install.bat',
    ),
  );
};
