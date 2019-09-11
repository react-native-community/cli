import {logger} from '@react-native-community/cli-tools';
import execa from 'execa';
import chalk from 'chalk';
import ora from 'ora';

type InstallArgs = {
  pkg: string;
  label?: string;
  succeedMessage?: string;
  loader: ora.Ora;
};

async function brewInstall({pkg, label, succeedMessage, loader}: InstallArgs) {
  loader.start(label);
  try {
    await execa('brew', ['install', pkg]);

    loader.succeed(succeedMessage);
  } catch (error) {
    loader.fail();
    logger.log(chalk.dim(`\n${error.stderr}`));
    logger.log(
      `An error occured while trying to install ${pkg}. Please try again manually: ${chalk.bold(
        `brew install ${pkg}`,
      )}`,
    );
  }
}

export {brewInstall};
