import execa from 'execa';
import type {Ora} from 'ora';
import {logError} from '@react-native-community/cli-doctor';

type InstallArgs = {
  pkg: string;
  label?: string;
  loader: Ora;
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

    logError({
      healthcheck: label || pkg,
      loader,
      error,
      command: `brew install ${pkg}`,
    });
  }
}

export {brewInstall};
