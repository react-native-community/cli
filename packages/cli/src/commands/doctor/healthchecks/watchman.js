// @flow
import Ora from 'ora';
// $FlowFixMe - converted to TS
import versionRanges from '../versionRanges';
// $FlowFixMe - converted to TS
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
// $FlowFixMe - converted to TS
import {install} from '../../../tools/install';
import type {EnvironmentInfo} from '../types';

const label = 'Watchman';

export default {
  label,
  getDiagnostics: ({Binaries}: EnvironmentInfo) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Watchman.version,
      versionRange: versionRanges.WATCHMAN,
    }),
  }),
  runAutomaticFix: async ({loader}: typeof Ora) =>
    await install({
      pkg: 'watchman',
      label,
      source: 'https://facebook.github.io/watchman/docs/install.html',
      loader,
    }),
};
