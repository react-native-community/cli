import ora from 'ora';
import {brewInstall} from './brewInstall';

type InstallArgs = {
  pkg: string;
  label: string;
  source: string;
  loader: ora.Ora;
};

async function install({pkg, label, source, loader}: InstallArgs) {
  try {
    switch (process.platform) {
      case 'darwin':
        await brewInstall({pkg, label, loader});
        break;
      default:
        throw new Error('Not implemented yet');
    }
  } catch (_error) {
    loader.info(`Please download and install '${pkg}' from ${source}.`);
  }
}

export {install};
