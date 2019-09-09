// @flow
import Ora from 'ora';
import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {install} from '../../../tools/install';
import type {EnvironmentInfo} from '../types';

export default {
  label: 'Watchman',
  getDiagnostics: ({Binaries}: EnvironmentInfo) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Watchman.version,
      versionRange: versionRanges.WATCHMAN,
    }),
  }),
  runAutomaticFix: async ({loader}: typeof Ora) =>
    await install(
      'watchman',
      'https://facebook.github.io/watchman/docs/install.html',
      loader,
    ),
};
