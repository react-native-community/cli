// @flow
import Ora from 'ora';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import type {EnvironmentInfo, HealthCheckInterface} from '../types';

export default ({
  label: 'Xcode',
  getDiagnostics: async ({IDEs}: EnvironmentInfo) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: IDEs.Xcode.version.split('/')[0],
      versionRange: versionRanges.XCODE,
    }),
  }),
  runAutomaticFix: async ({loader}: {loader: typeof Ora}) => {
    loader.info();

    logManualInstallation({
      healthcheck: 'Xcode',
      url: 'https://developer.apple.com/xcode/',
    });
  },
}: HealthCheckInterface);
