// @flow
import {checkSoftwareInstalled} from '../checkInstallation';
// $FlowFixMe - converted to TS
import {installCocoaPods} from '../../../tools/installPods';
import {type HealthCheckInterface} from '../types';

export default ({
  label: 'CocoaPods',
  getDiagnostics: async () => ({
    needsToBeFixed: await checkSoftwareInstalled('pod'),
  }),
  runAutomaticFix: async ({loader}) => await installCocoaPods(loader),
}: HealthCheckInterface);
