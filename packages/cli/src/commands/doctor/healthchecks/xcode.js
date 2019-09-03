// @flow
import Ora from 'ora';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import type {EnvironmentInfo} from '../types';

export default {
  label: 'Xcode',
  getDiagnostics: ({IDEs}: EnvironmentInfo) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: IDEs.Xcode.version.split('/')[0],
      versionRange: versionRanges.XCODE,
    }),
  }),
  runAutomaticFix: ({loader}: {loader: typeof Ora}) => {
    loader.info();

    logManualInstallation({
      healthcheck: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
};
