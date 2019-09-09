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

async function updatePods(loader: ora.Ora) {
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
    sudo.exec(command, (error: Error) => {
      if (error) {
        reject(error);
      }

      resolve();
    });
  });
}

async function installCocoaPods(loader: ora.Ora) {
  loader.stop();

  const withGem = 'Yes, with gem (may require sudo)';
  const withHomebrew = 'Yes, with Homebrew';

  const {shouldInstallCocoaPods} = await inquirer.prompt([
    {
      type: 'list',
      name: 'shouldInstallCocoaPods',
      message: `CocoaPods ${chalk.dim.underline(
        '(https://cocoapods.org/)',
      )} ${chalk.reset.bold(
        'is not installed. CocoaPods is necessary for the iOS project to run correctly. Do you want to install it?',
      )}`,
      choices: [withGem, withHomebrew],
    },
  ]);

  switch (shouldInstallCocoaPods) {
    case withGem:
      const options = ['install', 'cocoapods', '--no-document'];
      loader.start('Installing CocoaPods');
      try {
        // First attempt to install `cocoapods`
        await execa('gem', options);
      } catch (_error) {
        // If that doesn't work then try with sudo
        try {
          await runSudo(`gem ${options.join(' ')}`);
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
      loader.succeed();
      break;
    case withHomebrew:
      await brewInstall('cocoapods', loader);
      break;
  }
}

async function installPods({
  projectName,
  loader,
  shouldUpdatePods,
}: {
  projectName: string;
  loader?: ora.Ora;
  shouldUpdatePods: boolean;
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

    if (shouldUpdatePods) {
      await updatePods(loader);
    }

    try {
      loader.succeed();
      loader.start(
        `Installing CocoaPods dependencies ${chalk.dim(
          '(this may take a few minutes)',
        )}`,
      );
      await execa('pod', ['install']);
    } catch (error) {
      // "pod" command outputs errors to stdout (at least some of them)
      logger.log(error.stderr || error.stdout);

      throw new Error(
        `Failed to install CocoaPods dependencies for iOS project, which is required by this template.\nPlease try again manually: "cd ./${projectName}/ios && pod install".\nCocoaPods documentation: ${chalk.dim.underline(
          'https://cocoapods.org/',
        )}`,
      );
    }
  } catch (error) {
    throw error;
  } finally {
    process.chdir('..');
  }
}

export {installCocoaPods};

export default installPods;
