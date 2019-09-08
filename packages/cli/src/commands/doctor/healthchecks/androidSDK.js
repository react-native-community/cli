import chalk from 'chalk';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import execa from 'execa';

const installMessage = `Read more about how to update Android SDK at ${chalk.dim(
  'https://developer.android.com/studio',
)}`;

export default {
  label: 'Android SDK',
  getDiagnosticsAsync: async ({SDKs}) => {
    let sdks = SDKs['Android SDK'];

    // This is a workaround for envinfo's Android SDK check not working on
    // Windows. This can be removed when envinfo fixes it.
    // See the PR: https://github.com/tabrindle/envinfo/pull/119
    if (sdks === 'Not Found' && process.platform !== 'darwin') {
      try {
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
          matches.push(match[1]);
        }
        if (matches.length > 0) {
          sdks = {
            'Build Tools': matches,
          };
        }
      } catch {}
    }

    return {
      needsToBeFixed:
        (sdks === 'Not Found' && installMessage) ||
        doesSoftwareNeedToBeFixed({
          version: sdks['Build Tools'][0],
          versionRange: versionRanges.ANDROID_NDK,
        }),
    };
  },
  runAutomaticFix: async ({loader, environmentInfo}) => {
    const version = environmentInfo.SDKs['Android SDK'][0];
    const isNDKInstalled = version !== 'Not Found';

    loader.fail();

    if (isNDKInstalled) {
      return logManualInstallation({
        message: installMessage,
      });
    }

    return logManualInstallation({
      healthcheck: 'Android SDK',
      url: 'https://facebook.github.io/react-native/docs/getting-started',
    });
  },
};
