import androidSDK from '../androidSDK';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {NoopLoader} from '../../../../tools/loader';

import * as common from '../common';

const logSpy = jest.spyOn(common, 'logManualInstallation');

describe('androidHomeEnvVariables', () => {
  let initialEnvironmentInfo: EnvironmentInfo;
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    initialEnvironmentInfo = await getEnvironmentInfo();
  });

  beforeEach(() => {
    environmentInfo = initialEnvironmentInfo;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if the Android SDK is not installed', async () => {
    environmentInfo.SDKs['Android SDK'] = 'Not Found';
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(typeof diagnostics.needsToBeFixed).toBe('string');
  });

  it('returns a message if the SDK version is not in range', async () => {
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': [25],
    };
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(typeof diagnostics.needsToBeFixed).toBe('string');
  });

  it('returns false if the SDK version is in range', async () => {
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': ['27.0'],
    };
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen', async () => {
    const loader = new NoopLoader();

    androidSDK.runAutomaticFix({loader, environmentInfo});

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
