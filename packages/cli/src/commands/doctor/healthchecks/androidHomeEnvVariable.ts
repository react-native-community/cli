import chalk from 'chalk';
import {Ora} from 'ora';
import {logManualInstallation} from './common';
import {HealthCheckInterface} from '../types';

// List of answers on how to set `ANDROID_HOME` for each platform
const URLS = {
  darwin: 'https://stackoverflow.com/a/28296325/4252781',
  win32: 'https://stackoverflow.com/a/54888107/4252781',
  linux: 'https://stackoverflow.com/a/39228100/4252781',
};

const label = 'ANDROID_HOME';

// Force the options for the platform to avoid providing a link
// for `ANDROID_HOME` for every platform NodeJS supports
const platform = process.platform as 'darwin' | 'win32' | 'linux';

const message = `Read more about how to set the ${label} at ${chalk.dim(
  URLS[platform],
)}`;

export default {
  label,
  getDiagnostics: async () => ({
    needsToBeFixed: !process.env.ANDROID_HOME,
  }),
  runAutomaticFix: async ({loader}: {loader: Ora}) => {
    loader.fail();

    logManualInstallation({
      message,
    });
  },
} as HealthCheckInterface;
