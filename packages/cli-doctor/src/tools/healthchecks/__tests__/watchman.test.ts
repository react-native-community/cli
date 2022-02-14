import execa from 'execa';
import watchman from '../watchman';
import getEnvironmentInfo from '../../envinfo';
import {EnvironmentInfo} from '../../../types';
import {NoopLoader} from '@react-native-community/cli-tools';
import * as common from '../common';
import * as brewInstall from '../../brewInstall';

jest.mock('execa', () => jest.fn());

const logSpy = jest.spyOn(common, 'logManualInstallation');
const {logManualInstallation} = common;

describe('watchman', () => {
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
    ((execa as unknown) as jest.Mock).mockResolvedValue({stdout: ''});
  }, 60000);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if the watchman is not installed', async () => {
    // @ts-ignore - 'Not Found' is a valid return from envinfo but not typed here
    environmentInfo.Binaries.Watchman = 'Not Found';

    const diagnostics = await watchman.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if watchman is installed with v4 version', async () => {
    environmentInfo.Binaries.Watchman = {
      version: '4.9.0',
      path: '/unimportant/path',
    };

    const diagnostics = await watchman.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('returns false if watchman is installed with new date-based versions', async () => {
    environmentInfo.Binaries.Watchman = {
      version: '2020.02.07.00',
      path: '/unimportant/path',
    };

    const diagnostics = await watchman.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen for the non-macOS fix', async () => {
    // Pretend we are linux, all the time
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });

    const loader = new NoopLoader();

    await watchman.runAutomaticFix({
      loader,
      logManualInstallation,
      environmentInfo,
    });

    // Restore the platform before we assert anything that might fail
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('installs watchman on macOS when missing', async () => {
    // Pretend we are darwin, all the time
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });

    const loaderSpy = new NoopLoader();
    const loaderSucceedSpy = jest.spyOn(loaderSpy, 'succeed');
    const loaderFailSpy = jest.spyOn(loaderSpy, 'fail');
    const brewInstallSpy = jest
      .spyOn(brewInstall, 'brewInstall')
      .mockImplementation(({loader}) => {
        loader.succeed();
        return Promise.resolve();
      });

    await watchman.runAutomaticFix({
      loader: loaderSpy,
      logManualInstallation,
      environmentInfo,
    });

    // Restore the platform before we assert anything that might fail
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });

    expect(loaderFailSpy).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalledTimes(0);
    expect(brewInstallSpy).toBeCalledTimes(1);
    expect(loaderSucceedSpy).toBeCalledTimes(1);
  });
});
