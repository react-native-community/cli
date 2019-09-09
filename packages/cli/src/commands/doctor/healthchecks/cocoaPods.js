// @flow
import {isSoftwareInstalled} from '../checkInstallation';
// $FlowFixMe - converted to TS
import {installCocoaPods} from '../../../tools/installPods';
import {type HealthCheckInterface} from '../types';

export default ({
  label: 'CocoaPods',
  getDiagnostics: async () => ({
    needsToBeFixed: !(await isSoftwareInstalled('pod')),
  }),
  runAutomaticFix: async ({loader}) => await installCocoaPods(loader),
}: HealthCheckInterface);
