// @flow
import nodeJS from './nodeJS';
import {yarn, npm} from './packageManagers';
import watchman from './watchman';
// $FlowFixMe - converted to TS
import androidHomeEnvVariable from './androidHomeEnvVariable';
import androidSDK from './androidSDK';
// $FlowFixMe - converted to TS
import androidNDK from './androidNDK';
import xcode from './xcode';
// $FlowFixMe - converted to TS
import cocoaPods from './cocoaPods';
import iosDeploy from './iosDeploy';

export const HEALTHCHECK_TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
};

type Options = {
  fix: boolean | void,
  contributor: boolean | void,
};

export const getHealthchecks = ({contributor}: Options) => ({
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
