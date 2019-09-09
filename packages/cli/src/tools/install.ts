import ora from 'ora';
import {brewInstall} from './brewInstall';

async function install(pkg: string, source: string, loader: ora.Ora) {
  try {
    switch (process.platform) {
      case 'darwin':
        await brewInstall(pkg, loader);
        break;
      default:
        throw new Error('Not implemented yet');
    }
  } catch (_error) {
    loader.info(`Please download and install '${pkg}' from ${source}.`);
  }
}

export {install};
