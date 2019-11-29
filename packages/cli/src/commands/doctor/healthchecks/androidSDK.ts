import chalk from 'chalk';
import fs from 'fs';
import {logManualInstallation} from './common';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '../types';

const getBuildToolsVersion = (): string => {
  // TODO: get relative path, first search for where the `package.json` is
  const gradleBuildFilePath = 'android/build.gradle';
  const buildToolsVersionEntry = 'buildToolsVersion';

  // Read the content of the `build.gradle` file
  const gradleBuildFile = fs.readFileSync(gradleBuildFilePath, 'utf-8');

  const buildToolsVersionIndex = gradleBuildFile.indexOf(
    buildToolsVersionEntry,
  );

  const buildToolsVersion = gradleBuildFile
    // Get only the portion of the declaration of `buildToolsVersion`
    .substring(buildToolsVersionIndex)
    .split('\n')[0]
    // Get only the the value of `buildToolsVersion`
    .match(/\d|\../g)
    .join('');

  return buildToolsVersion;
};

const installMessage = `Read more about how to update Android SDK at ${chalk.dim(
  'https://developer.android.com/studio',
)}`;

export default {
  label: 'Android SDK',
  description: 'Required for building and installing your app on Android',
  getDiagnostics: async ({}) => {
    // TODO: also check if this version is contained within `SDKs['Android SDK']['Build Tools']
    const version = getBuildToolsVersion();
    console.log(version);
    return {
      version,
      versionRange: versionRanges.ANDROID_SDK,
      needsToBeFixed:
        version === 'Not Found' ||
        doesSoftwareNeedToBeFixed({
          version,
          versionRange: versionRanges.ANDROID_SDK,
        }),
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
