import fs from 'fs';
import execa from 'execa';
import chalk from 'chalk';
import prompts from 'prompts';
import {logger, NoopLoader} from '@react-native-community/cli-tools';
import sudo from 'sudo-prompt';
import runBundleInstall from './runBundleInstall';
import {brewInstall} from './brewInstall';
import {Loader} from '../types';

type PromptCocoaPodsInstallation = {
  installMethod: 'gem' | 'homebrew';
  promptQuestion: string;
};

async function runPodInstall(
  loader: Loader,
  directory: string,
  shouldHandleRepoUpdate: boolean = true,
) {
  try {
    loader.start(
      `Installing CocoaPods dependencies ${chalk.dim(
        '(this may take a few minutes)',
      )}`,
    );

    await execa('bundle', ['exec', 'pod', 'install']);
  } catch (error) {
    // "pod" command outputs errors to stdout (at least some of them)
    const stderr = error.stderr || error.stdout;

    /**
     * If CocoaPods failed due to repo being out of date, it will
     * include the update command in the error message.
     *
     * `shouldHandleRepoUpdate` will be set to `false` to
     * prevent infinite loop (unlikely scenario)
     */
    if (stderr.includes('pod repo update') && shouldHandleRepoUpdate) {
      await runPodUpdate(loader);
      await runPodInstall(loader, directory, false);
    } else {
      loader.fail();
      logger.error(stderr);

      throw new Error(
        'Looks like your iOS environment is not properly set. Please go to https://reactnative.dev/docs/next/environment-setup and follow the React Native CLI QuickStart guide for macOS and iOS.',
      );
    }
  }
}

async function runPodUpdate(loader: Loader) {
  try {
    loader.start(
      `Updating CocoaPods repositories ${chalk.dim(
        '(this may take a few minutes)',
      )}`,
    );
    await execa('pod', ['repo', 'update']);
  } catch (error) {
    // "pod" command outputs errors to stdout (at least some of them)
    logger.log(error.stderr || error.stdout);
    loader.fail();

    throw new Error(
      `Failed to update CocoaPods repositories for iOS project.\nPlease try again manually: "pod repo update".\nCocoaPods documentation: ${chalk.dim.underline(
        'https://cocoapods.org/',
      )}`,
    );
  }
}

function runSudo(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sudo.exec(command, {name: 'React Native CLI'}, (error) => {
      if (error) {
        reject(error);
      }

      resolve();
    });
  });
}

async function promptCocoaPodsInstallationQuestion(): Promise<
  PromptCocoaPodsInstallation
> {
  const promptQuestion = `CocoaPods ${chalk.dim.underline(
    '(https://cocoapods.org/)',
  )} ${chalk.reset.bold(
    'is not installed. CocoaPods is necessary for the iOS project to run correctly. Do you want to install it?',
  )}`;
  const installWithGem = 'Yes, with gem (may require sudo)';
  const installWithHomebrew = 'Yes, with Homebrew';

  const {installMethod} = await prompts([
    {
      type: 'select',
      name: 'installMethod',
      message: promptQuestion,
      choices: [
        {title: installWithGem, value: 'gem'},
        {title: installWithHomebrew, value: 'homebrew'},
      ],
    },
  ]);

  return {
    installMethod,
    // This is used for removing the message in `doctor` after it's answered
    promptQuestion: `? ${promptQuestion} ${
      installMethod === 'gem' ? installWithGem : installWithHomebrew
    }`,
  };
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

async function installCocoaPods(loader: Loader) {
  loader.stop();

  const {installMethod} = await promptCocoaPodsInstallationQuestion();

  if (installMethod === 'gem') {
    loader.start('Installing CocoaPods');

    try {
      await installCocoaPodsWithGem();

      return loader.succeed();
    } catch (error) {
      loader.fail();
      logger.error(error.stderr);

      throw new Error(
        `An error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: sudo gem install cocoapods.\nCocoaPods documentation: ${chalk.dim.underline(
          'https://cocoapods.org/',
        )}`,
      );
    }
  }

  if (installMethod === 'homebrew') {
    return await brewInstall({
      pkg: 'cocoapods',
      label: 'Installing CocoaPods',
      loader,
    });
  }
}

async function installPods({
  directory,
  loader,
}: {
  directory: string;
  loader?: Loader;
}) {
  loader = loader || new NoopLoader();
  try {
    if (!fs.existsSync('ios')) {
      return;
    }

    process.chdir('ios');

    const hasPods = fs.existsSync('Podfile');

    if (!hasPods) {
      return;
    }

    if (fs.existsSync('../Gemfile')) {
      await runBundleInstall(loader);
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

    await runPodInstall(loader, directory);
  } finally {
    process.chdir('..');
  }
}

export {promptCocoaPodsInstallationQuestion, runSudo, installCocoaPods};

export default installPods;
