/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getEnvironmentInfo from '../tools/envinfo';
import {logger, version} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import {getArchitecture} from '@react-native-community/cli-platform-ios';
import {readFile} from 'fs-extra';
import path from 'path';
import {stringify} from 'yaml';

type PlatformValues = {
  hermesEnabled: boolean | string;
  newArchEnabled: boolean | string;
};

interface Platforms {
  Android: PlatformValues;
  iOS: PlatformValues;
}

const info = async function getInfo(_argv: Array<string>, ctx: Config) {
  try {
    logger.info('Fetching system and libraries information...');

    const notFound = 'Not found';

    const platforms: Platforms = {
      Android: {
        hermesEnabled: notFound,
        newArchEnabled: notFound,
      },
      iOS: {
        hermesEnabled: notFound,
        newArchEnabled: notFound,
      },
    };

    if (process.platform !== 'win32' && ctx.project.ios?.sourceDir) {
      try {
        const podfile = await readFile(
          path.join(ctx.project.ios.sourceDir, '/Podfile.lock'),
          'utf8',
        );

        platforms.iOS.hermesEnabled = podfile.includes('hermes-engine');
      } catch (e) {
        platforms.iOS.hermesEnabled = notFound;
      }

      try {
        const isNewArchitecture = await getArchitecture(
          ctx.project.ios.sourceDir,
        );

        platforms.iOS.newArchEnabled = isNewArchitecture;
      } catch {
        platforms.iOS.newArchEnabled = notFound;
      }
    }

    if (ctx.project.android?.sourceDir) {
      try {
        const gradleProperties = await readFile(
          path.join(ctx.project.android.sourceDir, '/gradle.properties'),
          'utf8',
        );

        platforms.Android.hermesEnabled =
          gradleProperties.includes('hermesEnabled=true');
        platforms.Android.newArchEnabled = gradleProperties.includes(
          'newArchEnabled=true',
        );
      } catch {
        platforms.Android.hermesEnabled = notFound;
        platforms.Android.newArchEnabled = notFound;
      }
    }

    const output = await getEnvironmentInfo();

    logger.log(stringify({...output, ...platforms}));
  } catch (err) {
    logger.error(`Unable to print environment info.\n${err}`);
  } finally {
    await version.logIfUpdateAvailable(ctx.root);
  }
};

export default {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  func: info,
};
