import execa from 'execa';
import python from '../python';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {NoopLoader} from '../../../../tools/loader';
import * as common from '../common';

jest.mock('execa');
jest.mock('@react-native-community/cli-tools', () => ({
  fetchToTemp: jest.fn(),
}));

const logSpy = jest.spyOn(common, 'logManualInstallation');

describe('python', () => {
  let environmentInfo: EnvironmentInfo;

  beforeAll(async () => {
    environmentInfo = await getEnvironmentInfo();
  }, 15000);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns a message if Python is not installed', async () => {
    environmentInfo.Languages.Python = 'Not Found';
    ((execa as unknown) as jest.Mock).mockResolvedValue({stdout: ''});
    const diagnostics = await python.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('returns false if Python version is in range', async () => {
    // @ts-ignore
    environmentInfo.Languages.Python = {
      version: '2.7.17',
    };

    const diagnostics = await python.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  // envinfo has a special field for reporting Python 3 so no need to check for python 3

  it('logs manual installation steps to the screen for the default fix', async () => {
    const loader = new NoopLoader();
    await python.runAutomaticFix({loader, environmentInfo});
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('downloads and executes the installation on Windows when missing', async () => {
    const loader = new NoopLoader();
    const loaderSucceedSpy = jest.spyOn(loader, 'succeed');
    const loaderFailSpy = jest.spyOn(loader, 'fail');

    await python.win32AutomaticFix({loader, environmentInfo});

    expect(loaderFailSpy).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalledTimes(0);
    expect(loaderSucceedSpy).toBeCalledWith('Python installed successfully');
  });
});
