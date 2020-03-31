import execa from 'execa';
import jdk from '../jdk';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {NoopLoader} from '../../../../tools/loader';
import * as common from '../common';
import * as unzip from '../../../../tools/unzip';
import * as deleteFile from '../../../../tools/deleteFile';

jest.mock('execa', () => jest.fn());
jest
  .spyOn(deleteFile, 'deleteFile')
  .mockImplementation(() => Promise.resolve());

const mockFetchToTemp = jest.fn();
jest.mock('@react-native-community/cli-tools', () => {
  return {
    fetchToTemp: mockFetchToTemp,
  };
});

const logSpy = jest.spyOn(common, 'logManualInstallation');

describe('jdk', () => {
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
  }, 15000);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if JDK is not installed', async () => {
    environmentInfo.Languages.Java = 'Not Found';
    ((execa as unknown) as jest.Mock).mockResolvedValue({stdout: ''});
    const diagnostics = await jdk.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if JDK version is in range', async () => {
    // @ts-ignore
    environmentInfo.Languages.Java = {
      version: '9',
    };

    const diagnostics = await jdk.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('returns true if JDK version is not in range', async () => {
    // @ts-ignore
    environmentInfo.Languages.Java = {
      version: '7',
    };

    const diagnostics = await jdk.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('logs manual installation steps to the screen for the default fix', async () => {
    const loader = new NoopLoader();
    await jdk.runAutomaticFix({loader, environmentInfo});
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('downloads and unzips JDK on Windows when missing', async () => {
    const loader = new NoopLoader();
    const loaderSucceedSpy = jest.spyOn(loader, 'succeed');
    const loaderFailSpy = jest.spyOn(loader, 'fail');
    const unzipSpy = jest
      .spyOn(unzip, 'unzip')
      .mockImplementation(() => Promise.resolve());

    await jdk.win32AutomaticFix({loader, environmentInfo});

    expect(loaderFailSpy).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalledTimes(0);
    expect(unzipSpy).toBeCalledTimes(1);
    expect(loaderSucceedSpy).toBeCalledWith(
      'JDK installed successfully. Please restart your shell to see the changes',
    );
  });
});
