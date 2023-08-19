import {
  getDefaultUserTerminal,
  isPackagerRunning,
} from '@react-native-community/cli-tools';
import {HealthCheckInterface} from '../../types';
import {logManualInstallation} from './common';
import execa from 'execa';
import path from 'path';

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
        await execa('node', [
          path.join(config.reactNativePath, 'cli.js'),
          'start',
          '--port',
          port.toString(),
          '--terminal',
          terminal,
        ]);
        return loader.succeed();
      }
      return logManualInstallation({
        message:
          'Could not start the bundler. Please run "npx react-native start" command manually.',
      });
    } catch (error) {
      return logManualInstallation({
        message:
          'Could not start the bundler. Please run "npx react-native start" command manually.',
      });
    }
  },
} as HealthCheckInterface;
