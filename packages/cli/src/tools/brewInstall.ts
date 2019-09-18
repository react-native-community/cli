import {logger} from '@react-native-community/cli-tools';
import execa from 'execa';
import chalk from 'chalk';
import ora from 'ora';

type InstallArgs = {
  pkg: string;
  label?: string;
  loader: ora.Ora;
  onSuccess?: () => void;
  onFail?: () => void;
};

async function brewInstall({
  pkg,
  label,
  loader,
  onSuccess,
  onFail,
}: InstallArgs) {
  loader.start(label);

  try {
    await execa('brew', ['install', pkg]);

    if (typeof onSuccess === 'function') {
      return onSuccess();
    }

    return loader.succeed();
  } catch (error) {
    if (typeof onFail === 'function') {
      return onFail();
    }

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
