import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {logManualInstallation} from './common';
import {HealthCheckInterface} from '../types';
import findProjectRoot from '../../../tools/config/findProjectRoot';

const getBuildToolsVersion = (): string => {
  const projectRoot = findProjectRoot();
  const gradleBuildFilePath = path.join(projectRoot, 'android/build.gradle');

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
  getDiagnostics: async ({SDKs}) => {
    const requiredVersion = getBuildToolsVersion();

    if (!requiredVersion) {
      return {
        versions: SDKs['Android SDK']['Build Tools'],
        versionRange: undefined,
        needsToBeFixed: true,
      };
    }

    const isRequiredVersionInstalled = SDKs['Android SDK'][
      'Build Tools'
    ].includes(requiredVersion);

    return {
      versions: SDKs['Android SDK']['Build Tools'],
      versionRange: requiredVersion,
      needsToBeFixed: !isRequiredVersionInstalled,
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
