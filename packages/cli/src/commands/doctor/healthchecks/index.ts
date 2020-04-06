import nodeJS from './nodeJS';
import {yarn, npm} from './packageManagers';
import jdk from './jdk';
import python from './python';
import watchman from './watchman';
import androidHomeEnvVariable from './androidHomeEnvVariable';
import androidSDK from './androidSDK';
import androidNDK from './androidNDK';
import xcode from './xcode';
import cocoaPods from './cocoaPods';
import iosDeploy from './iosDeploy';
import {Healthchecks} from '../types';

export const HEALTHCHECK_TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

type Options = {
  fix: boolean | void;
  contributor: boolean | void;
};

export const getHealthchecks = ({contributor}: Options): Healthchecks => ({
  common: {
    label: 'Common',
    healthchecks: [
      nodeJS,
      yarn,
      npm,
      ...(process.platform === 'darwin' ? [watchman] : []),
      ...(process.platform === 'win32' ? [python] : []),
    ],
  },
  android: {
    label: 'Android',
    healthchecks: [
      jdk,
      androidHomeEnvVariable,
      androidSDK,
      ...(contributor ? [androidNDK] : []),
    ],
  },
  ...(process.platform === 'darwin'
    ? {
        ios: {
          label: 'iOS',
          healthchecks: [xcode, cocoaPods, iosDeploy],
        },
      }
    : {}),
});
