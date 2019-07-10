// @flow
import fs from 'fs';
import execa from 'execa';
import chalk from 'chalk';
import Ora from 'ora';
import inquirer from 'inquirer';
import commandExists from 'command-exists';
import {logger} from '@react-native-community/cli-tools';
import {NoopLoader} from './loader';

async function installPods({
  projectName,
  loader,
}: {
  projectName: string,
  loader?: typeof Ora,
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
      await commandExists('pod');
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
        },
      ]);

      if (shouldInstallCocoaPods) {
        loader.start(
          `Installing CocoaPods ${chalk.dim('(this make take a few minutes)')}`,
        );

        try {
          // First attempt to install `cocoapods`
          await execa('gem', ['install', 'cocoapods']);
          loader.succeed();
        } catch (_error) {
          try {
            // If that doesn't work then try with sudo
            await execa('sudo', ['gem', 'install', 'cocoapods']);
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

        try {
          loader.start('Updating CocoaPods repositories');
          await execa('pod', ['repo', 'update']);
          loader.succeed();
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
    }

    try {
      loader.succeed();
      loader.start(
        `Installing CocoaPods dependencies ${chalk.dim(
          '(this make take a few minutes)',
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
