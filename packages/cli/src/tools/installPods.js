import fs from 'fs-extra';
import execa from 'execa';
import chalk from 'chalk';
import inquirer from 'inquirer';
import commandExists from 'command-exists';
import {logger} from '@react-native-community/cli-tools';

async function installPods({
  projectName,
  loader,
}: {
  projectName: string,
  loader: typeof Ora,
}) {
  try {
    process.chdir('ios');

    const hasPods = await fs.pathExists('Podfile');

    if (!hasPods) {
      return;
    }

    try {
      await commandExists('pod');
    } catch (err) {
      loader.stop();

      const {shouldInstallCocoaPods} = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstallCocoaPods',
          message: 'CocoaPods is not installed, do you want to install it?',
        },
      ]);

      if (shouldInstallCocoaPods) {
        try {
          // First attempt to install `cocoapods`
          await execa('gem', ['install', 'cocoapods']);
        } catch (err) {
          try {
            // If that doesn't work then try with sudo
            await execa('sudo', ['gem', 'install', 'cocoapods']);
          } catch (err) {
            throw new Error(
              `Error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: "sudo gem install cocoapods".\nCocoaPods documentation: ${chalk.dim.underline(
                'https://cocoapods.org/',
              )}`,
            );
          }
        }

        // This only shows when `CocoaPods` is automatically installed,
        // if it's already installed then we just show the `Installing dependencies` step
        loader.start('Installing CocoaPods dependencies');
      }
    }

    try {
      await execa('pod', ['install']);
    } catch (err) {
      logger.log(err.stderr || err.stdout);

      throw new Error(
        `Failed to install CocoaPods dependencies for iOS project, which is required by this template.\nPlease try again manually: "cd ./${projectName}/ios && pod install".\nCocoaPods documentation: ${chalk.dim.underline(
          'https://cocoapods.org/',
        )}`,
      );
    }
  } catch (err) {
    throw err;
  } finally {
    process.chdir('..');
  }
}

export default installPods;
