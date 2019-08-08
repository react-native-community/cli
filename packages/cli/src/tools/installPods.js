// @flow
import fs from 'fs';
import execa from 'execa';
import chalk from 'chalk';
import Ora from 'ora';
import inquirer from 'inquirer';
import {logger} from '@react-native-community/cli-tools';
import {NoopLoader} from './loader';

async function updatePods(loader: typeof Ora) {
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

async function installPods({
  projectName,
  loader,
  shouldUpdatePods,
}: {
  projectName: string,
  loader?: typeof Ora,
  shouldUpdatePods: boolean,
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

      const {shouldInstallCocoaPods} = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstallCocoaPods',
          message: `CocoaPods ${chalk.dim.underline(
            '(https://cocoapods.org/)',
          )} ${chalk.reset.bold(
            "is not installed. It's necessary for iOS project to run correctly. Do you want to install it?",
          )}`,
          default: true,
        },
      ]);

      if (shouldInstallCocoaPods) {
        loader.start('Installing CocoaPods');

        try {
          // First attempt to install `cocoapods`
          await execa('gem', ['install', 'cocoapods', '--no-document']);
          loader.succeed();
        } catch (_error) {
          try {
            // If that doesn't work then try with sudo
            await execa('sudo', [
              'gem',
              'install',
              'cocoapods',
              '--no-document',
            ]);
          } catch (error) {
            loader.fail();
            logger.log(error.stderr);

            throw new Error(
              `Error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: "sudo gem install cocoapods".\nCocoaPods documentation: ${chalk.dim.underline(
                'https://cocoapods.org/',
              )}`,
            );
          }
        }

        await updatePods(loader);
      }
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

export default installPods;
