import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import {logManualInstallation} from './common';
import {HealthCheckInterface, EnvironmentInfo} from '../types';
import findProjectRoot from '../../../tools/config/findProjectRoot';
import {
  getAndroidSdkRootInstallation,
  installComponent,
  getBestHypervisor,
} from './androidWinHelpers';
import {downloadAndUnzip} from '../../../tools/downloadAndUnzip';

import {
  setEnvironment,
  updateEnvironment,
} from '../../../tools/windows/environmentVariables';
import {executeCommand} from '../../../tools/windows/executeWinCommand';

const getBuildToolsVersion = (): string => {
  // TODO use config
  const projectRoot = findProjectRoot();
  const gradleBuildFilePath = path.join(projectRoot, 'android/build.gradle');

  const buildToolsVersionEntry = 'buildToolsVersion';

  if (!fs.existsSync(gradleBuildFilePath)) {
    return 'Not Found';
  }

  // Read the content of the `build.gradle` file
  const gradleBuildFile = fs.readFileSync(gradleBuildFilePath, 'utf-8');

  const buildToolsVersionIndex = gradleBuildFile.indexOf(
    buildToolsVersionEntry,
  );

  const buildToolsVersion = (
    gradleBuildFile
      // Get only the portion of the declaration of `buildToolsVersion`
      .substring(buildToolsVersionIndex)
      .split('\n')[0]
      // Get only the the value of `buildToolsVersion`
      .match(/\d|\../g) || []
  ).join('');

  return buildToolsVersion || 'Not Found';
};

const installMessage = `Read more about how to update Android SDK at ${chalk.dim(
  'https://developer.android.com/studio',
)}`;

const isSDKInstalled = (environmentInfo: EnvironmentInfo) => {
  const version = environmentInfo.SDKs['Android SDK'];
  return version !== 'Not Found';
};

const enableWHPX = () => {
  // Need to prompt for UAC
  return executeCommand(
    'DISM /Quiet /NoRestart /Online /Enable-Feature /All /FeatureName:Microsoft-Hyper-V /FeatureName:HypervisorPlatform',
    true,
  );
};

const enableHAXM = async (installPath: string) => {
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
    path.join(
      installPath,
      'Sdk',
      'extras',
      'intel',
      'Hardware_Accelerated_Execution_Manager',
      'silent_install.bat',
    ),
  );
};

const enableAMDH = async (installPath: string) => {
  await installComponent(
    'extras;google;Android_Emulator_Hypervisor_Driver',
    installPath,
  );

  await executeCommand(
    path.join(
      installPath,
      'Sdk',
      'extras',
      'google',
      'Android_Emulator_Hypervisor_Driver',
      'silent_install.bat',
    ),
  );
};

export default {
  label: 'Android SDK',
  description: 'Required for building and installing your app on Android',
  getDiagnostics: async ({SDKs}) => {
    const requiredVersion = getBuildToolsVersion();
    const buildTools =
      typeof SDKs['Android SDK'] === 'string'
        ? SDKs['Android SDK']
        : SDKs['Android SDK']['Build Tools'];

    const isAndroidSDKInstalled = Array.isArray(buildTools);

    const isRequiredVersionInstalled = isAndroidSDKInstalled
      ? buildTools.includes(requiredVersion)
      : false;

    return {
      versions: isAndroidSDKInstalled ? buildTools : SDKs['Android SDK'],
      versionRange: requiredVersion,
      needsToBeFixed: !isRequiredVersionInstalled,
    };
  },
  win32AutomaticFix: async ({loader}) => {
    const cliToolsUrl =
      'https://dl.google.com/android/repository/commandlinetools-win-6200805_latest.zip';

    // Installing 29 as well so Android Studio does not complain
    const componentsToInstall = [
      'platform-tools',
      'build-tools;28.0.3',
      'build-tools;29.0.3',
      'platforms;android-28',
      'platforms;android-29',
      'emulator',
      'system-images;android-28;google_apis;x86_64',
      '--licenses', // Accept any pending licenses at the end
    ];

    const androidSDKRoot = getAndroidSdkRootInstallation();

    await downloadAndUnzip({
      loader,
      downloadUrl: cliToolsUrl,
      component: 'Android Command Line Tools',
      installPath: androidSDKRoot,
    });

    // Need to create the Sdk folder otherwise sdkmanager will complain 🤦‍♂️
    // mkdirpSync(path.join(installPath, 'Sdk'));

    for (const component of componentsToInstall) {
      loader.text = `Installing ${component}`;

      try {
        await installComponent(component, androidSDKRoot);
      } catch (e) {
        console.error(e);
      }
    }

    loader.text = 'Updating environment variables';

    /**
     * Use `ANDROID_HOME` instead of `ANDROID_SDK_ROOT` because that is the
     * recommendation by the RN docs and tools such as envinfo do not
     * recognize it yet.
     */
    await setEnvironment('ANDROID_HOME', androidSDKRoot);
    await updateEnvironment('PATH', path.join(androidSDKRoot, 'tools'));
    await updateEnvironment(
      'PATH',
      path.join(androidSDKRoot, 'platform-tools'),
    );

    loader.text =
      'Configuring Hypervisor for faster emulation, this might prompt UAC';

    // Delay here?

    const {hypervisor, installed} = await getBestHypervisor(androidSDKRoot);

    if (!installed) {
      if (hypervisor === 'none') {
        loader.warn(
          'Android SDK configured but virtualization could not be enabled.',
        );
        return;
      }

      if (hypervisor === 'AMDH') {
        await enableAMDH(androidSDKRoot);
      } else if (hypervisor === 'HAXM') {
        await enableHAXM(androidSDKRoot);
      } else if (hypervisor === 'WHPX') {
        await enableWHPX();
      }
    }

    // Create AVD?

    loader.succeed('Android SDK configured');
  },
  runAutomaticFix: async ({loader, environmentInfo}) => {
    loader.fail();

    if (isSDKInstalled(environmentInfo)) {
      return logManualInstallation({
        message: installMessage,
      });
    }

    return logManualInstallation({
      healthcheck: 'Android SDK',
      url: 'https://reactnative.dev/docs/getting-started',
    });
  },
} as HealthCheckInterface;
