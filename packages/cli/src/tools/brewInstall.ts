import {logger} from '@react-native-community/cli-tools';
import execa from 'execa';
import Ora from 'ora';

async function brewInstall(pkg: string, loader: Ora.Ora) {
  loader.start(`Installing ${pkg}`);
  try {
    await execa('brew', ['install', pkg]);
    loader.succeed();
  } catch (error) {
    logger.log(error.stderr);
    loader.fail(
      `An error occured while trying to install ${pkg}. Please try again manually: brew install ${pkg}`,
    );
  }
}

export {brewInstall};
