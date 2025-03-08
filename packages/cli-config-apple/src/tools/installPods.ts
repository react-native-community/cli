import fs from 'fs';
import execa from 'execa';
import type {Ora} from 'ora';
import chalk from 'chalk';
import {
  logger,
  NoopLoader,
  link,
  CLIError,
  runSudo,
} from '@react-native-community/cli-tools';

interface PodInstallOptions {
  newArchEnabled?: boolean;
  iosFolderPath?: string;
  useBundler?: boolean;
  root?: string;
}

interface RunPodInstallOptions {
  shouldHandleRepoUpdate?: boolean;
  newArchEnabled?: boolean;
  useBundler?: boolean;
}

async function runPodInstall(loader: Ora, options: RunPodInstallOptions) {
  const shouldHandleRepoUpdate = options?.shouldHandleRepoUpdate || true;
  try {
    loader.start(
      `Installing CocoaPods dependencies ${chalk.bold(
        options?.newArchEnabled ? 'with New Architecture' : '',
      )} ${chalk.dim('(this may take a few minutes)')}`,
    );
    const command = options.useBundler ? 'bundle' : 'pod';
    const args = options.useBundler ? ['exec', 'pod', 'install'] : ['install'];

    await execa(command, args, {
      env: {
        RCT_NEW_ARCH_ENABLED: options?.newArchEnabled ? '1' : '0',
        RCT_IGNORE_PODS_DEPRECATION: '1', // From React Native 0.79 onwards, users shouldn't install CocoaPods manually.
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
          'environment-setup',
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
    await execa('pod', ['repo', 'update']);
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

    try {
      // Check if "pod" is available and usable. It happens that there are
      // multiple versions of "pod" command and even though it's there, it exits
      // with a failure
      await execa('pod', ['--version']);
    } catch (e) {
      loader.info();
      await installCocoaPods(loader);
    }
    await runPodInstall(loader, {
      useBundler: options?.useBundler,
      newArchEnabled: options?.newArchEnabled,
    });
  } finally {
    process.chdir(options?.root ?? '..');
  }
}

export {installCocoaPods};

export default installPods;
