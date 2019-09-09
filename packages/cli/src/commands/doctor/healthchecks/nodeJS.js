// @flow
import Ora from 'ora';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {logManualInstallation} from './common';
import type {EnvironmentInfo, HealthCheckInterface} from '../types';

export default ({
  label: 'Node.js',
  getDiagnostics: async ({Binaries}: EnvironmentInfo) => ({
    version: Binaries.Node.version,
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Node.version,
      versionRange: versionRanges.NODE_JS,
    }),
  }),
  runAutomaticFix: async ({loader}: {loader: typeof Ora}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Node.js',
      url: 'https://nodejs.org/en/download/',
    });
  },
}: HealthCheckInterface);
