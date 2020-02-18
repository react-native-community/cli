import androidNDK from '../androidNDK';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {NoopLoader} from '../../../../tools/loader';

import * as common from '../common';

const logSpy = jest.spyOn(common, 'logManualInstallation');

describe('androidNDK', () => {
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
  }, 15000);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if the Android SDK is not installed', async () => {
    environmentInfo.SDKs['Android SDK'] = 'Not Found';
    const diagnostics = await androidNDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns a message if the Android NDK is not installed', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Android NDK': 'Not Found',
    };
    const diagnostics = await androidNDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns a message if the NDK version is not in range', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Android NDK': '18',
    };
    const diagnostics = await androidNDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if the NDK version is in range', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Android NDK': '19',
    };
    const diagnostics = await androidNDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen', () => {
    const loader = new NoopLoader();

    androidNDK.runAutomaticFix({loader, environmentInfo});

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
