// @flow
import fs from 'fs-extra';
import execa from 'execa';
import chalk from 'chalk';
import Ora from 'ora';
import inquirer from 'inquirer';
import commandExists from 'command-exists';
import {logger} from '@react-native-community/cli-tools';

const COCOAPODS_INSTALLATION_TIMEOUT = 30000;

async function installPods({
  projectName,
  loader,
}: {
  projectName: string,
  loader?: typeof Ora,
}) {
  try {
    process.chdir('ios');

    const hasPods = await fs.pathExists('Podfile');

    if (!hasPods) {
      return;
    }

    try {
      await commandExists('pod');
    } catch (e) {
      if (loader) {
        loader.stop();
      }

      const {shouldInstallCocoaPods} = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstallCocoaPods',
          message: `CocoaPods ${chalk.dim.underline(
            '(https://cocoapods.org/)',
          )} ${chalk.reset.bold(
            "is not installed. It's necessary for iOS project to run correctly. Do you want to install it?",
          )}`,
        },
      ]);

      if (shouldInstallCocoaPods) {
        // Show a helpful notice when installation takes more than usually
        const cocoaPodsInstallationTimeMessage = setTimeout(
          () =>
            logger.info('Installing CocoaPods, this may take a few minutes'),
          COCOAPODS_INSTALLATION_TIMEOUT,
        );
        try {
          // First attempt to install `cocoapods`
          await execa('gem', ['install', 'cocoapods']);
        } catch (_error) {
          try {
            // If that doesn't work then try with sudo
            await execa('sudo', ['gem', 'install', 'cocoapods']);
          } catch (error) {
            logger.log(error.stderr);

            throw new Error(
              `Error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: "sudo gem install cocoapods".\nCocoaPods documentation: ${chalk.dim.underline(
                'https://cocoapods.org/',
              )}`,
            );
          }
        } finally {
          clearTimeout(cocoaPodsInstallationTimeMessage);
        }

        // This only shows when `CocoaPods` is automatically installed,
        // if it's already installed then we just show the `Installing dependencies` step
        if (loader) {
          loader.start('Installing CocoaPods dependencies');
        }
      }
    }

    try {
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
