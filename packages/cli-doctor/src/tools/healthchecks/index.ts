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
import packager from './packager';
import gradle from './gradle';
import deepmerge from 'deepmerge';
import {logger} from '@react-native-community/cli-tools';

export const HEALTHCHECK_TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

type Options = {
  fix: boolean | void;
  contributor: boolean | void;
};

export const getHealthchecks = async ({
  contributor,
}: Options): Promise<Healthchecks> => {
  let additionalChecks: HealthCheckCategory[] = [];
  let projectSpecificHealthchecks = {};
  let config;

  // Doctor can run in a detached mode, where there isn't a config so this can fail
  try {
    config = await loadConfig({});
    additionalChecks = config.healthChecks;

    if (config.reactNativePath) {
      projectSpecificHealthchecks = {
        common: {
          label: 'Common',
          healthchecks: [packager],
        },
        android: {
          label: 'Android',
          healthchecks: [androidSDK],
        },
        ...(process.platform === 'darwin' && {
          ios: {
            label: 'iOS',
            healthchecks: [xcodeEnv],
          },
        }),
      };
    }
  } catch {}

  if (!config) {
    logger.log();
    logger.info(
      'Detected that command has been run outside of React Native project, running basic healthchecks.',
    );
  }

  const defaultHealthchecks = {
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
        androidHomeEnvVariable,
        gradle,
        ...(contributor ? [androidNDK] : []),
      ],
    },
    ...(process.platform === 'darwin'
      ? {
          ios: {
            label: 'iOS',
            healthchecks: [xcode, ruby, cocoaPods, iosDeploy],
          },
        }
      : {}),
    ...additionalChecks,
  };

  return deepmerge(defaultHealthchecks, projectSpecificHealthchecks);
};
