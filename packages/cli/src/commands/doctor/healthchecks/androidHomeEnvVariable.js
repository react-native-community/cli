import chalk from 'chalk';
import {logManualInstallation} from './common';

// List of answers on how to set `ANDROID_HOME` for each platform
const URLS = {
  darwin: 'https://stackoverflow.com/a/28296325/4252781',
  win32: 'https://stackoverflow.com/a/54888107/4252781',
  linux: 'https://stackoverflow.com/a/39228100/4252781',
};

const label = 'ANDROID_HOME environment variable';

const iosDeploy = {
  label,
  getDiagnostics: () => ({
    needsToBeFixed: !process.env.ANDROID_HOME,
  }),
  runAutomaticFix: async ({loader}) => {
    loader.info();

    logManualInstallation({
      message: `Read more about how to set the ${label} at ${chalk.dim(
        URLS[process.platform],
      )}.`,
    });
  },
};

export default iosDeploy;
