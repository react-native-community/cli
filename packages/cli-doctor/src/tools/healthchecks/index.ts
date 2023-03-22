import nodeJS from './nodeJS';
import {yarn, npm} from './packageManagers';
import adb from './adb';
import jdk from './jdk';
import watchman from './watchman';
import ruby from './ruby';
import androidHomeEnvVariable from './androidHomeEnvVariable';
import androidStudio from './androidStudio';
import androidSDK from './androidSDK';
import androidNDK from './androidNDK';
import xcode from './xcode';
import cocoaPods from './cocoaPods';
import iosDeploy from './iosDeploy';
import {Healthchecks, HealthCheckCategory} from '../../types';
import loadConfig from '@react-native-community/cli-config';
import xcodeEnv from './xcodeEnv';

export const HEALTHCHECK_TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

type Options = {
  fix: boolean | void;
  contributor: boolean | void;
};

export const getHealthchecks = ({contributor}: Options): Healthchecks => {
  let additionalChecks: HealthCheckCategory[] = [];

  // Doctor can run in a detached mode, where there isn't a config so this can fail
  try {
    let config = loadConfig();
    additionalChecks = config.healthChecks;
  } catch {}

  return {
    common: {
      label: 'Common',
      healthchecks: [
        nodeJS,
        yarn,
        npm,
        ...(process.platform === 'darwin' ? [watchman] : []),
      ],
    },
    android: {
      label: 'Android',
      healthchecks: [
        adb,
        jdk,
        androidStudio,
        androidSDK,
        androidHomeEnvVariable,
        ...(contributor ? [androidNDK] : []),
      ],
    },
    ...(process.platform === 'darwin'
      ? {
          ios: {
            label: 'iOS',
            healthchecks: [xcode, ruby, cocoaPods, iosDeploy, xcodeEnv],
          },
        }
      : {}),
    ...additionalChecks,
  };
};
