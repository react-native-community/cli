import execa from 'execa';
import fs from 'fs';
import {logger, CLIError, prompt} from '@react-native-community/cli-tools';

import adb from './adb';
import type {AndroidProject, Flags} from './';

async function tryInstallAppOnDevice(
  args: Flags,
  adbPath: string,
  device: string,
  androidProject: AndroidProject,
  selectedTask?: string,
) {
  try {
    // "app" is usually the default value for Android apps with only 1 app
    const {appName, sourceDir} = androidProject;

    const defaultVariant = 'debug';

    // handle if selected task from interactive mode, or mode from arguments, includes build flavour as well, eg. installProductionDebug should create ['production','debug'] array
    const variantFromSelectedTask = (selectedTask ?? args.mode)
      ?.replace('install', '')
      .split(/(?=[A-Z])/);

    // create path to output file, eg. `production/debug`
    // ensure multiflavored path is correct, e.g. `clientStagingDebug` -> `clientStaging/debug`
    const variantPath = variantFromSelectedTask
      ? `${variantFromSelectedTask
          .slice(0, -1)
          .join('')}/${variantFromSelectedTask.at(-1)!.toLocaleLowerCase()}`
      : defaultVariant;
    // create output file name, eg. `production-debug`
    const variantAppName =
      variantFromSelectedTask?.join('-')?.toLowerCase() ?? defaultVariant;

    let pathToApk: string;
    if (!args.binaryPath) {
      const buildDirectory = `${sourceDir}/${appName}/build/outputs/apk/${variantPath}`;
      const apkFile = getInstallApkName(
        appName,
        adbPath,
        variantAppName,
        device,
        buildDirectory,
      );
      pathToApk = `${buildDirectory}/${apkFile}`;
    } else {
      pathToApk = args.binaryPath;
    }

    const install = () => {
      const installArgs = ['-s', device, 'install', '-r', '-d'];
      if (args.user !== undefined) {
        installArgs.push('--user', `${args.user}`);
      }
      const adbArgs = [...installArgs, pathToApk];
      logger.info(`Installing the app on the device "${device}"...`);
      logger.debug(`Running command "cd android && adb ${adbArgs.join(' ')}"`);
      execa.sync(adbPath, adbArgs, {stdio: ['inherit', 'inherit', 'pipe']});
    };

    try {
      install();
    } catch (error) {
      const stderr = ((error as any).stderr || '').toString();
      logger.log(stderr);
      if (!stderr.includes('INSTALL_FAILED_VERSION_DOWNGRADE')) {
        throw error;
      }
      await handleVersionDowngrade(
        args,
        adbPath,
        device,
        androidProject,
        install,
      );
    }
  } catch (error) {
    throw new CLIError(
      'Failed to install the app on the device.',
      error as any,
    );
  }
}

async function handleVersionDowngrade(
  args: Flags,
  adbPath: string,
  device: string,
  androidProject: AndroidProject,
  install: () => void,
) {
  const {reinstall}: {reinstall: boolean} = await prompt({
    type: 'confirm',
    name: 'reinstall',
    message:
      'The app installed on the device has a newer version than the one being installed. Do you want to uninstall the existing app and install again?',
    initial: false,
  });

  if (!reinstall) {
    throw new Error('Installation cancelled: INSTALL_FAILED_VERSION_DOWNGRADE');
  }

  const applicationId = [
    args.appId || androidProject.applicationId,
    args.appIdSuffix,
  ]
    .filter(Boolean)
    .join('.');
  const uninstallArgs = ['-s', device, 'uninstall'];
  if (args.user !== undefined) {
    uninstallArgs.push('--user', `${args.user}`);
  }
  uninstallArgs.push(applicationId);
  logger.info(`Uninstalling "${applicationId}" from the device "${device}"...`);
  logger.debug(`Running command "adb ${uninstallArgs.join(' ')}"`);
  execa.sync(adbPath, uninstallArgs, {stdio: 'inherit'});
  install();
}

function getInstallApkName(
  appName: string,
  adbPath: string,
  variant: string,
  device: string,
  buildDirectory: string,
) {
  const availableCPUs = adb.getAvailableCPUs(adbPath, device);

  // check if there is an apk file like app-armeabi-v7a-debug.apk
  for (const availableCPU of availableCPUs.concat('universal')) {
    const apkName = `${appName}-${availableCPU}-${variant}.apk`;
    if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
      return apkName;
    }
  }

  // check if there is a default file like app-debug.apk
  const apkName = `${appName}-${variant}.apk`;
  if (fs.existsSync(`${buildDirectory}/${apkName}`)) {
    return apkName;
  }

  throw new Error('Could not find the correct install APK file.');
}

export default tryInstallAppOnDevice;
