import {logger} from '@react-native-community/cli-tools';
import execa from 'execa';
import chalk from 'chalk';
import ora from 'ora';

type InstallArgs = {
  pkg: string;
  label?: string;
  loader: ora.Ora;
};

async function brewInstall({pkg, label, loader}: InstallArgs) {
  loader.start(label);
  try {
    await execa('brew', ['install', pkg]);

    loader.succeed();
  } catch (error) {
    loader.fail();
    logger.log(`\n${error.stderr}`);
    logger.log(
      `An error occured while trying to install ${pkg}. Please try again manually: ${chalk.dim(
        `brew install ${pkg}`,
      )}`,
    );
  }
}

export {brewInstall};
