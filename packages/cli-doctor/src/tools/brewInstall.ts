import execa from 'execa';
import {Loader} from '../types';
import {logError} from './healthchecks/common';

type InstallArgs = {
  pkg: string;
  label?: string;
  loader: Loader;
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
