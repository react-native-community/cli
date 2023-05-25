import {
  getDefaultUserTerminal,
  isPackagerRunning,
} from '@react-native-community/cli-tools';
import {HealthCheckInterface} from '../../types';
import {logManualInstallation} from './common';
import {startServerInNewWindow} from '@react-native-community/cli-plugin-metro';

export default {
  label: 'Metro',
  isRequired: false,
  description: 'Required for bundling the JavaScript code',
  getDiagnostics: async () => {
    const status = await isPackagerRunning();
    const needsToBeFixed = status === 'not_running';
    if (needsToBeFixed) {
      return {
        description: 'Metro Bundler is not running',
        needsToBeFixed,
      };
    }
    return {
      needsToBeFixed,
    };
  },
  runAutomaticFix: async ({loader, config}) => {
    loader.fail();
    try {
      const terminal = getDefaultUserTerminal();
      const port = Number(process.env.RCT_METRO_PORT) || 8081;
      if (terminal && config) {
        startServerInNewWindow(
          port,
          terminal,
          config.root,
          config.reactNativePath,
        );
        return loader.succeed();
      }
      return logManualInstallation({
        message:
          'Could not start the bundler. Please run "react-native start" command manually.',
      });
    } catch (error) {
      return logManualInstallation({
        message:
          'Could not start the bundler. Please run "react-native start" command manually.',
      });
    }
  },
} as HealthCheckInterface;
