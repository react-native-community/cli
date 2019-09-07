import chalk from 'chalk';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {exec} from 'child_process';

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
        sdks = await new Promise((resolve, reject) => {
          exec(
            process.env.ANDROID_HOME
              ? `${process.env.ANDROID_HOME}/tools/bin/sdkmanager --list`
              : 'sdkmanager --list',
            (err, stdout) => {
              if (err) {
                reject();
              } else {
                const matches = [];
                const regex = /build-tools;([\d|.]+)[\S\s]/g;
                let match = null;
                while ((match = regex.exec(stdout)) !== null) {
                  matches.push(match[1]);
                }
                matches.length > 0
                  ? resolve({
                      'Build Tools': matches,
                    })
                  : reject();
              }
            },
          );
        });
      } catch {
        sdks = 'Not Found';
      }
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
