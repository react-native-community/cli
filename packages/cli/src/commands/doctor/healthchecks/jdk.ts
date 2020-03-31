import {fetchToTemp} from '@react-native-community/cli-tools';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import {HealthCheckInterface} from '../types';

import {
  setEnvironment,
  updateEnvironment,
} from '../../../tools/environmentVariables';
import {join} from 'path';
import {Ora} from 'ora';
import {unzip} from '../../../tools/unzip';
import {deleteFile} from '../../../tools/deleteFile';

export default {
  label: 'JDK',
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
  win32AutomaticFix: async ({loader}: {loader: Ora}) => {
    try {
      // Installing JDK 11 because later versions seem to cause issues with gradle at the moment
      const installerUrl =
        'https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_windows-x64_bin.zip';
      const installPath = process.env.LOCALAPPDATA || ''; // The zip is in a folder `jdk-11.02` so it can be unzipped directly there

      loader.start(
        `Downloading JDK 11 from "${installerUrl}" (this may take a few minutes)`,
      );

      const installer = await fetchToTemp(installerUrl);

      loader.text = `Installing JDK in "${installPath}"`;

      await unzip(installer, installPath);

      await deleteFile(installer);

      loader.text = 'Updating environment variables';

      const jdkPath = join(installPath, 'jdk-11.0.2');

      await setEnvironment('JAVA_HOME', jdkPath);
      await updateEnvironment('PATH', join(jdkPath, 'bin'));

      loader.succeed(
        'JDK installed successfully. Please restart your shell to see the changes',
      );
    } catch (e) {
      loader.fail(e);
    }
  },
  runAutomaticFix: async () => {
    logManualInstallation({
      healthcheck: 'JDK',
      url: 'https://openjdk.java.net/',
    });
  },
} as HealthCheckInterface;
