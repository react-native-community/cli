import chalk from 'chalk';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import execa from 'execa';
import {HealthCheckInterface} from '../types';

const installMessage = `Read more about how to update Android SDK at ${chalk.dim(
  'https://developer.android.com/studio',
)}`;

export default {
  label: 'Android SDK',
  getDiagnostics: async ({SDKs}) => {
    let sdks = SDKs['Android SDK'];

    // This is a workaround for envinfo's Android SDK check not working on
    // Windows. This can be removed when envinfo fixes it.
    // See the PR: https://github.com/tabrindle/envinfo/pull/119
    if (sdks === 'Not Found' && process.platform !== 'darwin') {
      try {
        // $FlowFixMe bad execa types
        const {stdout} = await execa(
          process.env.ANDROID_HOME
            ? `${process.env.ANDROID_HOME}/tools/bin/sdkmanager`
            : 'sdkmanager',
          ['--list'],
        );

        const matches = [];
        const regex = /build-tools;([\d|.]+)[\S\s]/g;
        let match = null;
        while ((match = regex.exec(stdout)) !== null) {
          if (match) {
            matches.push(match[1]);
          }
        }
        if (matches.length > 0) {
          sdks = {
            'Build Tools': matches,
            'API Levels': 'Not Found',
            'Android NDK': 'Not Found',
            'System Images': 'Not Found',
          };
        }
      } catch {}
    }

    return {
      needsToBeFixed:
        (sdks === 'Not Found' && installMessage) ||
        (sdks !== 'Not Found' &&
          doesSoftwareNeedToBeFixed({
            version: sdks['Build Tools'][0],
            versionRange: versionRanges.ANDROID_SDK,
          })),
    };
  },
  runAutomaticFix: async ({loader, environmentInfo}) => {
    const version = environmentInfo.SDKs['Android SDK'];
    const isSDKInstalled = version !== 'Not Found';

    loader.fail();

    if (isSDKInstalled) {
      return logManualInstallation({
        message: installMessage,
      });
    }

    return logManualInstallation({
      healthcheck: 'Android SDK',
      url: 'https://facebook.github.io/react-native/docs/getting-started',
    });
  },
} as HealthCheckInterface;
