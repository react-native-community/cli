import {join} from 'path';

import {link} from '@react-native-community/cli-tools';

import {HealthCheckInterface} from '../../types';

import {downloadAndUnzip} from '../downloadAndUnzip';
import {executeCommand} from '../windows/executeWinCommand';
import {getUserAndroidPath} from '../windows/androidWinHelpers';
import {createShortcut} from '../windows/create-shortcut';

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
      const archSuffix = process.arch === 'x64' ? '64' : '';

      // Check if Android Studio is installed in one of its default locations
      const primaryAndroidStudioPath = join(
        getUserAndroidPath(),
        'android-studio',
        'bin',
        `studio${archSuffix}.exe`,
      ).replace(/\\/g, '\\\\');
      const {stdout} = await executeCommand(
        `wmic datafile where name="${primaryAndroidStudioPath}" get Version`,
      );
      let version = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();

      if (version !== '') {
        return {
          needsToBeFixed: false,
          version,
        };
      }

      // 2) fallback path under %LOCALAPPDATA%\Programs\Android Studio
      // This is the path used by the JetBrains Toolbox / Android Studio installer
      const altBase = process.env.LOCALAPPDATA || '';
      const fallbackPath = join(
        altBase,
        'Programs',
        'Android Studio',
        'bin',
        `studio${archSuffix}.exe`,
      ).replace(/\\/g, '\\\\');
      try {
        const {stdout} = await executeCommand(
          `wmic datafile where name="${fallbackPath}" get Version`,
        );
        version = stdout.replace(/(\r\n|\n|\r)/gm, '').trim();
      } catch {
        version = '';
      }

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
      'https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2022.3.1.18/android-studio-2022.3.1.18-windows.zip';

    const installPath = getUserAndroidPath();
    await downloadAndUnzip({
      loader,
      downloadUrl: androidStudioUrl,
      component: 'Android Studio',
      installPath: installPath,
    });

    const archSuffix = process.arch === 'x64' ? '64' : '';
    const binFolder = join(installPath, 'android-studio', 'bin');

    await createShortcut({
      path: join(binFolder, `studio${archSuffix}.exe`),
      name: 'Android Studio',
      ico: join(binFolder, 'studio.ico'),
    });

    loader.success(
      `Android Studio installed successfully in "${installPath}".`,
    );
  },
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.error();

    return logManualInstallation({
      healthcheck: 'Android Studio',
      url: link.docs('set-up-your-environment', 'android', {
        hash: 'android-studio',
        guide: 'native',
      }),
    });
  },
} as HealthCheckInterface;
