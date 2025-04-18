import {join} from 'path';

import {link} from '@react-native-community/cli-tools';

import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '../../types';
import {downloadAndUnzip} from '../downloadAndUnzip';
import {
  setEnvironment,
  updateEnvironment,
} from '../windows/environmentVariables';

export default {
  label: 'JDK',
  description: 'Required to compile Java code',
  getDiagnostics: async ({Languages}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version:
        typeof Languages.Java === 'string'
          ? Languages.Java
          : Languages.Java.version,
      versionRange: versionRanges.JAVA,
    }),

    version:
      typeof Languages.Java === 'string'
        ? Languages.Java
        : Languages.Java.version,
    versionRange: versionRanges.JAVA,
  }),
  win32AutomaticFix: async ({loader}) => {
    try {
      // Installing JDK 11 because later versions seem to cause issues with gradle at the moment
      const installerUrl =
        'https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_windows-x64_bin.zip';
      const installPath = process.env.LOCALAPPDATA || ''; // The zip is in a folder `jdk-11.02` so it can be unzipped directly there

      await downloadAndUnzip({
        loader,
        downloadUrl: installerUrl,
        component: 'JDK',
        installPath,
      });

      loader.text = 'Updating environment variables';

      const jdkPath = join(installPath, 'jdk-11.0.2');

      await setEnvironment('JAVA_HOME', jdkPath);
      await updateEnvironment('PATH', join(jdkPath, 'bin'));

      loader.succeed(
        'JDK installed successfully. Please restart your shell to see the changes',
      );
    } catch (e) {
      loader.fail(e as any);
    }
  },
  runAutomaticFix: async ({logManualInstallation, loader}) => {
    loader.fail();
    logManualInstallation({
      healthcheck: 'JDK',
      url: link.docs('set-up-your-environment', 'android', {
        hash: 'jdk-studio',
        guide: 'native',
      }),
    });
  },
} as HealthCheckInterface;
