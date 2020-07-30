import {fetchToTemp} from '@react-native-community/cli-tools';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '@react-native-community/cli-types';

import {updateEnvironment} from '../../../tools/windows/environmentVariables';
import {join} from 'path';
import {executeCommand} from '../../../tools/windows/executeWinCommand';

export default {
  label: 'Python',
  getDiagnostics: async ({Languages}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version:
        typeof Languages.Python === 'string'
          ? Languages.Python
          : Languages.Python.version,
      versionRange: versionRanges.PYTHON,
    }),

    version:
      typeof Languages.Python === 'string'
        ? Languages.Python
        : Languages.Python.version,
    versionRange: versionRanges.PYTHON,
  }),
  win32AutomaticFix: async ({loader}) => {
    try {
      const arch = process.arch === 'x64' ? 'amd64.' : '';
      const installerUrl = `https://www.python.org/ftp/python/2.7.9/python-2.7.9.${arch}msi`;
      const installPath = join(process.env.LOCALAPPDATA || '', 'python2');

      loader.start(`Downloading Python installer from "${installerUrl}"`);

      const installer = await fetchToTemp(installerUrl);

      loader.text = `Installing Python in "${installPath}"`;
      const command = `msiexec.exe /i "${installer}" TARGETDIR="${installPath}" /qn /L*P "python-log.txt"`;

      await executeCommand(command);

      loader.text = 'Updating environment variables';

      await updateEnvironment('PATH', installPath);
      await updateEnvironment('PATH', join(installPath, 'scripts'));

      loader.succeed('Python installed successfully');
    } catch (e) {
      loader.fail(e);
    }
  },
  runAutomaticFix: async ({logManualInstallation}) => {
    /**
     * Python is only needed on Windows so this method should never be called.
     * Leaving it in case that changes and as an example of how to have a
     * fallback.
     */
    logManualInstallation({
      healthcheck: 'Python',
      url: 'https://www.python.org/downloads/',
    });
  },
} as HealthCheckInterface;
