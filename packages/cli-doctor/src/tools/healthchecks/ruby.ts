import versionRanges from '../versionRanges';
import {doesSoftwareNeedToBeFixed} from '../checkInstallation';
import {HealthCheckInterface} from '../../types';

export default {
  label: 'Ruby',
  isRequired: false,
  getDiagnostics: async ({Managers}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Managers.RubyGems.version,
      versionRange: versionRanges.RUBY,
    }),
    version: Managers.RubyGems.version,
    versionRange: versionRanges.RUBY,
  }),
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Ruby',
      url: 'https://www.ruby-lang.org/en/downloads/',
    });
  },
} as HealthCheckInterface;
