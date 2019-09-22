import androidHomeEnvVariables from '../androidHomeEnvVariable';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {NoopLoader} from '../../../../tools/loader';

import * as common from '../common';

const logSpy = jest.spyOn(common, 'logManualInstallation');

describe('androidHomeEnvVariables', () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    process.env = OLD_ENV;
    jest.resetAllMocks();
  });

  it('returns a message if no ANDROID_HOME is defined', async () => {
    delete process.env.ANDROID_HOME;

    const environmentInfo = await getEnvironmentInfo();
    const diagnostics = await androidHomeEnvVariables.getDiagnostics(
      environmentInfo,
    );
    expect(typeof diagnostics.needsToBeFixed).toBe('string');
  });

  it('returns false if ANDROID_HOME is defined', async () => {
    process.env.ANDROID_HOME = '/fake/path/to/android/home';

    const environmentInfo = await getEnvironmentInfo();
    const diagnostics = await androidHomeEnvVariables.getDiagnostics(
      environmentInfo,
    );
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen', async () => {
    const loader = new NoopLoader();

    const environmentInfo = await getEnvironmentInfo();

    androidHomeEnvVariables.runAutomaticFix({loader, environmentInfo});

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
