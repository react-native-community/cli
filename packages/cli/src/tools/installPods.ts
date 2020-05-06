import fs from 'fs';
import execa from 'execa';
import chalk from 'chalk';
import ora from 'ora';
// @ts-ignore untyped
import inquirer from 'inquirer';
import {logger} from '@react-native-community/cli-tools';
import {NoopLoader} from './loader';
// @ts-ignore untyped
import sudo from 'sudo-prompt';
import {brewInstall} from './brewInstall';

type PromptCocoaPodsInstallation = {
  installMethod: 'gem' | 'homebrew';
  promptQuestion: string;
};

async function runPodInstall(
  loader: ora.Ora,
  projectName: string,
  shouldHandleRepoUpdate: boolean = true,
) {
  try {
    loader.start(
      `Installing CocoaPods dependencies ${chalk.dim(
        '(this may take a few minutes)',
      )}`,
    );
    await execa('pod', ['install']);
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
      await runPodInstall(loader, projectName, false);
    } else {
      loader.fail();
      throw new Error(
        `Failed to install CocoaPods dependencies for iOS project, which is required by this template.\nPlease try again manually: "cd ./${projectName}/ios && pod install".\nCocoaPods documentation: ${chalk.dim.underline(
          'https://cocoapods.org/',
        )}`,
      );
    }
  }
}

async function runPodUpdate(loader: ora.Ora) {
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
    sudo.exec(command, {name: 'React Native CLI'}, error => {
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

  const {shouldInstallCocoaPods} = await inquirer.prompt([
    {
      type: 'list',
      name: 'shouldInstallCocoaPods',
      message: promptQuestion,
      choices: [installWithGem, installWithHomebrew],
    },
  ]);

  const shouldInstallWithGem = shouldInstallCocoaPods === installWithGem;

  return {
    installMethod: shouldInstallWithGem ? 'gem' : 'homebrew',
    // This is used for removing the message in `doctor` after it's answered
    promptQuestion: `? ${promptQuestion} ${
      shouldInstallWithGem ? installWithGem : installWithHomebrew
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

async function installCocoaPods(loader: ora.Ora) {
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
  projectName,
  loader,
}: {
  projectName: string;
  loader?: ora.Ora;
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

    try {
      // Check if "pod" is available and usable. It happens that there are
      // multiple versions of "pod" command and even though it's there, it exits
      // with a failure
      await execa('pod', ['--version']);
    } catch (e) {
      loader.info();
      await installCocoaPods(loader);
    }

    await runPodInstall(loader, projectName);
  } catch (error) {
    throw error;
  } finally {
    process.chdir('..');
  }
}

export {promptCocoaPodsInstallationQuestion, runSudo, installCocoaPods};

export default installPods;
