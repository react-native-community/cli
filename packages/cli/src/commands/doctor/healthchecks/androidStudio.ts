import {join} from 'path';

import {HealthCheckInterface} from '@react-native-community/cli-types';

import {downloadAndUnzip} from '../../../tools/downloadAndUnzip';
import {executeCommand} from '../../../tools/windows/executeWinCommand';
import {getUserAndroidPath} from '../../../tools/windows/androidWinHelpers';
import {createShortcut} from '../../../tools/windows/create-shortcut';

export default {
  label: 'Android Studio',
  description: 'Required for building and installing your app on Android',
  getDiagnostics: async ({IDEs}) => {
    const needsToBeFixed = IDEs['Android Studio'] === 'Not Found';

    const missing = {
      needsToBeFixed,
      version: IDEs['Android Studio'],
    };

    // On Windows `doctor` installs Android Studio locally in a well-known place
    if (needsToBeFixed && process.platform === 'win32') {
      const androidStudioPath = join(
        getUserAndroidPath(),
        'android-studio',
        'bin',
        'studio.exe',
      ).replace(/\\/g, '\\\\');
      const {stdout} = await executeCommand(
        `wmic datafile where name="${androidStudioPath}" get Version`,
      );
      const version = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();

      if (version === '') {
        return missing;
      }

      return {
        needsToBeFixed: false,
        version,
      };
    }

    return missing;
  },
  win32AutomaticFix: async ({loader}) => {
    // Need a GitHub action to update automatically. See #1180
    const androidStudioUrl =
      'https://redirector.gvt1.com/edgedl/android/studio/ide-zips/3.6.3.0/android-studio-ide-192.6392135-windows.zip';

    const installPath = getUserAndroidPath();
    await downloadAndUnzip({
      loader,
      downloadUrl: androidStudioUrl,
      component: 'Android Studio',
      installPath: installPath,
    });

    const prefix = process.arch === 'x64' ? '64' : '';
    const binFolder = join(installPath, 'android-studio', 'bin');

    await createShortcut({
      path: join(binFolder, `studio${prefix}.exe`),
      name: 'Android Studio',
      ico: join(binFolder, 'studio.ico'),
    });

    loader.succeed(
      `Android Studio installed successfully in "${installPath}".`,
    );
  },
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();

    return logManualInstallation({
      healthcheck: 'Android Studio',
      url: 'https://reactnative.dev/docs/environment-setup',
    });
  },
} as HealthCheckInterface;
