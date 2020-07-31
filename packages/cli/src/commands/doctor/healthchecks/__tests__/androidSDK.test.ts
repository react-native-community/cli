import * as os from 'os';
import {join} from 'path';
import execa from 'execa';
import {cleanup, writeFiles} from '../../../../../../../jest/helpers';
import androidSDK from '../androidSDK';
import getEnvironmentInfo from '../../../../tools/envinfo';
import * as downloadAndUnzip from '../../../../tools/downloadAndUnzip';
import {EnvironmentInfo} from '@react-native-community/cli-types';
import {NoopLoader} from '../../../../tools/loader';
import * as common from '../common';
import * as androidWinHelpers from '../../../../tools/windows/androidWinHelpers';
import * as environmentVariables from '../../../../tools/windows/environmentVariables';

const logSpy = jest.spyOn(common, 'logManualInstallation');
const {logManualInstallation} = common;

jest.mock('execa', () => jest.fn());

let mockWorkingDir = '';

// TODO remove when androidSDK starts getting gradle.build path from config
jest.mock('../../../../tools/config/findProjectRoot', () => () => {
  return mockWorkingDir;
});

describe('androidSDK', () => {
  beforeEach(() => {
    const random = Math.floor(Math.random() * 10000);
    mockWorkingDir = join(os.tmpdir(), `androidSdkTest-${random}`);

    writeFiles(mockWorkingDir, {
      'android/build.gradle': `
        buildscript {
          ext {
            buildToolsVersion = "28.0.3"
            minSdkVersion = 16
            compileSdkVersion = 28
            targetSdkVersion = 28
          }
        }
      `,
    });
  });

  afterAll(
    async () => await cleanup(join(mockWorkingDir, 'android/build.gradle')),
  );

  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
  }, 15000);

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
      'Build Tools': ['25.0.3'],
    };
    ((execa as unknown) as jest.Mock).mockResolvedValue({
      stdout: 'build-tools;25.0.3',
    });
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if the SDK version is in range', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': ['28.0.3'],
    };
    ((execa as unknown) as jest.Mock).mockResolvedValue({
      stdout: 'build-tools;28.0.3',
    });
    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen for the default fix', () => {
    const loader = new NoopLoader();
    androidSDK.runAutomaticFix({
      loader,
      logManualInstallation,
      environmentInfo,
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('installs the SDK if it is missing on Windows', async () => {
    const loader = new NoopLoader();
    const loaderSucceedSpy = jest.spyOn(loader, 'succeed');
    const loaderFailSpy = jest.spyOn(loader, 'fail');
    const downloadAndUnzipSpy = jest
      .spyOn(downloadAndUnzip, 'downloadAndUnzip')
      .mockImplementation(() => Promise.resolve());

    const installComponentSpy = jest
      .spyOn(androidWinHelpers, 'installComponent')
      .mockImplementation(() => Promise.resolve());

    jest
      .spyOn(androidWinHelpers, 'getAndroidSdkRootInstallation')
      .mockImplementation(() => '/Android/Sdk/Root');

    jest
      .spyOn(environmentVariables, 'setEnvironment')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(environmentVariables, 'updateEnvironment')
      .mockImplementation(() => Promise.resolve());

    // Happy path for Hypervisor: already installed
    jest
      .spyOn(androidWinHelpers, 'getBestHypervisor')
      .mockImplementation(() => {
        return Promise.resolve({hypervisor: 'WHPX', installed: true});
      });

    await androidSDK.win32AutomaticFix({
      loader,
      logManualInstallation,
      environmentInfo,
    });

    // 1. Download and unzip the SDK
    expect(downloadAndUnzipSpy).toBeCalledTimes(1);
    // 2. Install all required components
    const requiredComponents = [
      'platform-tools',
      'build-tools;29.0.3',
      'platforms;android-29',
      'build-tools;28.0.3',
      'platforms;android-28',
      'emulator',
      'system-images;android-28;google_apis;x86_64',
      '--licenses',
    ];
    // Make sure we are installing the right number
    expect(installComponentSpy.mock.calls.length).toBe(
      requiredComponents.length,
    );
    for (const call of installComponentSpy.mock.calls) {
      expect(requiredComponents.includes(call[0])).toBeTruthy();
    }

    expect(loaderFailSpy).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalledTimes(0);

    expect(loaderSucceedSpy).toBeCalledWith(
      'Android SDK configured. You might need to restart your PC for all changes to take effect.',
    );
  });

  it('returns true if a build.gradle is not found', async () => {
    // To avoid having to provide fake versions for all the Android SDK tools
    // @ts-ignore
    environmentInfo.SDKs['Android SDK'] = {
      'Build Tools': ['28.0.3'],
    };
    ((execa as unknown) as jest.Mock).mockResolvedValue({
      stdout: 'build-tools;28.0.3',
    });

    await cleanup(join(mockWorkingDir, 'android/build.gradle'));

    const diagnostics = await androidSDK.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });
});
