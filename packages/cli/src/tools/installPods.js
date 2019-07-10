// @flow
import fs from 'fs';
import execa from 'execa';
import chalk from 'chalk';
import Ora from 'ora';
import inquirer from 'inquirer';
import commandExists from 'command-exists';
import {logger} from '@react-native-community/cli-tools';

async function installPods({
  projectName,
  loader,
}: {
  projectName: string,
  loader?: typeof Ora,
}) {
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
      if (loader) {
        loader.info();
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
        if (loader) {
          loader.start('Installing CocoaPods');
        }

        try {
          // First attempt to install `cocoapods`
          await execa('gem', ['install', 'cocoapods']);
        } catch (_error) {
          try {
            // If that doesn't work then try with sudo
            await execa('sudo', ['gem', 'install', 'cocoapods']);
          } catch (error) {
            if (loader) {
              loader.fail();
            }
            logger.log(error.stderr);

            throw new Error(
              `Error occured while trying to install CocoaPods, which is required by this template.\nPlease try again manually: "sudo gem install cocoapods".\nCocoaPods documentation: ${chalk.dim.underline(
                'https://cocoapods.org/',
              )}`,
            );
          }
        } finally {
          if (loader) {
            loader.succeed();
          }
        }

        try {
          if (loader) {
            loader.start('Updating CocoaPods repositories');
          }

          await execa('pod', ['repo', 'update']);
        } catch (error) {
          // "pod" command outputs errors to stdout (at least some of them)
          logger.log(error.stderr || error.stdout);

          if (loader) {
            loader.fail();
          }

          throw new Error(
            `Failed to update CocoaPods repositories for iOS project.\nPlease try again manually: "pod repo update".\nCocoaPods documentation: ${chalk.dim.underline(
              'https://cocoapods.org/',
            )}`,
          );
        } finally {
          if (loader) {
            loader.succeed();
          }
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
