import execa from 'execa';
import androidSDK from '../androidSDK';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {NoopLoader} from '../../../../tools/loader';

import * as common from '../common';

const logSpy = jest.spyOn(common, 'logManualInstallation');

jest.mock('execa', () => jest.fn());

describe('androidSDK', () => {
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
    ((execa as unknown) as jest.Mock).mockResolvedValue({stdout: ''});
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns a message if the SDK version is not in range', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': [25],
    };
    ((execa as unknown) as jest.Mock).mockResolvedValue({
      stdout: 'build-tools;25.0',
    });
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if the SDK version is in range', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': ['26.0'],
    };
    ((execa as unknown) as jest.Mock).mockResolvedValue({
      stdout: 'build-tools;26.0',
    });
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen', () => {
    const loader = new NoopLoader();
    androidSDK.runAutomaticFix({loader, environmentInfo});
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
