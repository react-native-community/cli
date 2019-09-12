import {checkSoftwareInstalled} from '../checkInstallation';
import {installCocoaPods} from '../../../tools/installPods';
import {HealthCheckInterface} from '../types';

export default {
  label: 'CocoaPods',
  getDiagnostics: async () => ({
    needsToBeFixed: await checkSoftwareInstalled('pod'),
  }),
  runAutomaticFix: async ({loader}) => await installCocoaPods(loader),
} as HealthCheckInterface;
