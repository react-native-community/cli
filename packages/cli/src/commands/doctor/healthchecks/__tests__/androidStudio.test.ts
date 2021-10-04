import execa from 'execa';
import androidStudio from '../androidStudio';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '@react-native-community/cli-types';
import {NoopLoader} from '../../../../tools/loader';
import * as common from '../common';
import * as downloadAndUnzip from '../../../../tools/downloadAndUnzip';

jest.mock('execa', () => jest.fn());

const logSpy = jest.spyOn(common, 'logManualInstallation');
const {logManualInstallation} = common;

describe('androidStudio', () => {
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
    ((execa as unknown) as jest.Mock).mockResolvedValue({stdout: ''});
  }, 60000);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if the Android Studio is not installed', async () => {
    environmentInfo.IDEs['Android Studio'] = 'Not Found';

    const diagnostics = await androidStudio.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if Android Studio is installed', async () => {
    // @ts-ignore
    environmentInfo.IDEs['Android Studio'] = {
      version: '3.6.0.0',
    };

    const diagnostics = await androidStudio.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen for the default fix', async () => {
    const loader = new NoopLoader();

    await androidStudio.runAutomaticFix({
      loader,
      logManualInstallation,
      environmentInfo,
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('downloads and unzips Android Studio on Windows when missing', async () => {
    const loader = new NoopLoader();
    const loaderSucceedSpy = jest.spyOn(loader, 'succeed');
    const loaderFailSpy = jest.spyOn(loader, 'fail');
    const downloadAndUnzipSpy = jest
      .spyOn(downloadAndUnzip, 'downloadAndUnzip')
      .mockImplementation(() => Promise.resolve());

    await androidStudio.win32AutomaticFix({
      loader,
      logManualInstallation,
      environmentInfo,
    });

    expect(loaderFailSpy).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalledTimes(0);
    expect(downloadAndUnzipSpy).toBeCalledTimes(1);
    expect(loaderSucceedSpy).toBeCalledWith(
      `Android Studio installed successfully in "${
        downloadAndUnzipSpy.mock.calls[0][0].installPath || ''
      }".`,
    );
  });
});
