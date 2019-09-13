// @flow
import Ora from 'ora';
// $FlowFixMe - converted to TS
import versionRanges from '../versionRanges';
// $FlowFixMe - converted to TS
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
// $FlowFixMe - converted to TS
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
