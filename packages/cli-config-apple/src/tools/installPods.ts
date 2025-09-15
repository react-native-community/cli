import fs from 'fs';
import {execa} from 'execa';
import type {Ora} from 'ora';
import chalk from 'chalk';
import {
  logger,
  NoopLoader,
  link,
  CLIError,
  runSudo,
} from '@react-native-community/cli-tools';
import runBundleInstall from './runBundleInstall';
import {execaPod} from './pods';

interface PodInstallOptions {
  skipBundleInstall?: boolean;
  newArchEnabled?: boolean;
  iosFolderPath?: string;
}

interface RunPodInstallOptions {
  shouldHandleRepoUpdate?: boolean;
  newArchEnabled?: boolean;
}

async function runPodInstall(loader: Ora, options: RunPodInstallOptions) {
  const shouldHandleRepoUpdate = options?.shouldHandleRepoUpdate || true;
  try {
    loader.start(
      `Installing CocoaPods dependencies ${chalk.bold(
        options?.newArchEnabled ? 'with New Architecture' : '',
      )} ${chalk.dim('(this may take a few minutes)')}`,
    );

    await execaPod(['install'], {
      env: {
        RCT_NEW_ARCH_ENABLED: options?.newArchEnabled ? '1' : '0',
        RCT_IGNORE_PODS_DEPRECATION: '1', // From React Native 0.79 onwards, users shouldn't install CocoaPods manually.
        ...(process.env.USE_THIRD_PARTY_JSC && {
          USE_THIRD_PARTY_JSC: process.env.USE_THIRD_PARTY_JSC,
        }), // This is used to install the third party JSC.
        ...(process.env.RCT_USE_RN_DEP && {
          RCT_USE_RN_DEP: process.env.RCT_USE_RN_DEP,
        }), // prebuilt RN dep available from 0.80 onwards
        ...(process.env.RCT_USE_PREBUILT_RNCORE && {
          RCT_USE_PREBUILT_RNCORE: process.env.RCT_USE_PREBUILT_RNCORE,
        }), // whole RN core prebuilt from 0.81 onwards
      },
    });
  } catch (error) {
    logger.debug(error as string);
    // "pod" command outputs errors to stdout (at least some of them)
    const stderr = (error as any).stderr || (error as any).stdout;

    /**
     * If CocoaPods failed due to repo being out of date, it will
     * include the update command in the error message.
     *
     * `shouldHandleRepoUpdate` will be set to `false` to
     * prevent infinite loop (unlikely scenario)
     */
    if (stderr.includes('pod repo update') && shouldHandleRepoUpdate) {
      await runPodUpdate(loader);
      await runPodInstall(loader, {
        shouldHandleRepoUpdate: false,
        newArchEnabled: options?.newArchEnabled,
      });
    } else {
      loader.fail();
      logger.error(stderr);

      throw new CLIError(
        `Looks like your iOS environment is not properly set. Please go to ${link.docs(
          'set-up-your-environment',
          'ios',
          {guide: 'native'},
        )} and follow the React Native CLI QuickStart guide for macOS and iOS.`,
      );
    }
  }
}

async function runPodUpdate(loader: Ora) {
  try {
    loader.start(
      `Updating CocoaPods repositories ${chalk.dim(
        '(this may take a few minutes)',
      )}`,
    );
    await execaPod(['repo', 'update']);
  } catch (error) {
    // "pod" command outputs errors to stdout (at least some of them)
    logger.log((error as any).stderr || (error as any).stdout);
    loader.fail();

    throw new CLIError(
      `Failed to update CocoaPods repositories for iOS project.\nPlease try again manually: "pod repo update".\nCocoaPods documentation: ${chalk.dim.underline(
        'https://cocoapods.org/',
      )}`,
    );
  }
}

async function installCocoaPodsWithGem() {
  const options = ['install', 'cocoapods', '--no-document'];

  try {
    // First attempt to install `cocoapods`
    await execa('gem', options);
  } catch (_error) {
    // If that doesn't work then try with sudo
    await runSudo(`gem ${options.join(' ')}`);
  }
}

async function installCocoaPods(loader: Ora) {
  loader.stop();

  loader.start('Installing CocoaPods');

  try {
    await installCocoaPodsWithGem();

    return loader.succeed();
  } catch (error) {
    loader.fail();
    logger.error((error as any).stderr);

    throw new CLIError(
      `An error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: sudo gem install cocoapods.\nCocoaPods documentation: ${chalk.dim.underline(
        'https://cocoapods.org/',
      )}`,
    );
  }
}

async function installPods(loader?: Ora, options?: PodInstallOptions) {
  loader = loader || new NoopLoader();
  try {
    if (!options?.iosFolderPath && !fs.existsSync('ios')) {
      return;
    }

    process.chdir(options?.iosFolderPath ?? 'ios');

    const hasPods = fs.existsSync('Podfile');

    if (!hasPods) {
      return;
    }

    if (fs.existsSync('../Gemfile') && !options?.skipBundleInstall) {
      await runBundleInstall(loader);
    } else if (!fs.existsSync('../Gemfile')) {
      throw new CLIError(
        'Could not find the Gemfile. Currently the CLI requires to have this file in the root directory of the project to install CocoaPods. If your configuration is different, please install the CocoaPods manually.',
      );
    }

    try {
      // Check if "pod" is available and usable. It happens that there are
      // multiple versions of "pod" command and even though it's there, it exits
      // with a failure
      await execaPod(['--version']);
    } catch (e) {
      loader.info();
      await installCocoaPods(loader);
    }
    await runPodInstall(loader, {
      newArchEnabled: options?.newArchEnabled,
    });
  } finally {
    process.chdir('..');
  }
}

export {installCocoaPods};

export default installPods;
