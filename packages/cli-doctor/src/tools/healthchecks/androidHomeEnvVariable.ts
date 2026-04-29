import pico from 'picocolors';
import {HealthCheckInterface} from '../../types';

// List of answers on how to set `ANDROID_HOME` for each platform
const URLS = {
  darwin: 'https://stackoverflow.com/a/28296325/4252781',
  win32: 'https://stackoverflow.com/a/54888107/4252781',
  linux: 'https://stackoverflow.com/a/39228100/4252781',
};

const label = 'ANDROID_HOME';
const description =
  'Environment variable that points to your Android SDK installation';

// Force the options for the platform to avoid providing a link
// for `ANDROID_HOME` for every platform NodeJS supports
const platform = process.platform as 'darwin' | 'win32' | 'linux';

const message = `Read more about how to set the ${label} at ${pico.dim(
  URLS[platform],
)}`;

export default {
  label,
  description,
  getDiagnostics: async () => ({
    needsToBeFixed: !process.env.ANDROID_HOME,
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    // Variable could have been added if installing Android Studio so double checking
    if (process.env.ANDROID_HOME) {
      loader.succeed();

      return;
    }

    loader.fail();

    logManualInstallation({
      message,
    });
  },
} as HealthCheckInterface;
