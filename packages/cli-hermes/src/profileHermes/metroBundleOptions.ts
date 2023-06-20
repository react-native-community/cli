import {logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import type {HermesCPUProfile} from 'hermes-profile-transformer/dist/types/HermesProfile';

export interface MetroBundleOptions {
  platform: string;
  dev: boolean;
  minify: boolean;
}

export function getMetroBundleOptions(
  downloadedProfileFilePath: string,
): MetroBundleOptions {
  let options: MetroBundleOptions = {
    platform: 'android',
    dev: true,
    minify: false,
  };

  try {
    const contents: HermesCPUProfile = JSON.parse(
      fs.readFileSync(downloadedProfileFilePath, {
        encoding: 'utf8',
      }),
    );
    const matchBundleUrl = /^.*\((.*index\.bundle.*)\)/;
    let containsExpoDevMenu = false;
    let hadMatch = false;
    for (const frame of Object.values(contents.stackFrames)) {
      if (frame.name.includes('EXDevMenuApp')) {
        containsExpoDevMenu = true;
      }
      const match = matchBundleUrl.exec(frame.name);
      if (match) {
        const parsed = new URL(match[1]);
        const platform = parsed.searchParams.get('platform'),
          dev = parsed.searchParams.get('dev'),
          minify = parsed.searchParams.get('minify');
        if (platform) {
          options.platform = platform;
        }
        if (dev) {
          options.dev = dev === 'true';
        }
        if (minify) {
          options.minify = minify === 'true';
        }

        hadMatch = true;
        break;
      }
    }
    if (containsExpoDevMenu && !hadMatch) {
      logger.warn(`Found references to the Expo Dev Menu in your profiling sample.
You might have accidentally recorded the Expo Dev Menu instead of your own application.
To work around this, please reload your app twice before starting a profiler recording.`);
    }
  } catch (e) {
    throw e;
  }

  return options;
}
