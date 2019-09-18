import androidHomeEnvVariables from '../androidHomeEnvVariable';
import getEnvironmentInfo from '../../../../tools/envinfo';
import {EnvironmentInfo} from '../../types';
import {Ora} from 'ora';

jest.mock('../common');

import {logManualInstallation} from '../common';

describe('androidHomeEnvVariables', () => {
  const OLD_ENV = process.env;

  it('returns a message if no ANDROID_HOME is defined', async () => {
    delete process.env.ANDROID_HOME;

    const environmentInfo: EnvironmentInfo = JSON.parse(
      await getEnvironmentInfo(),
    );
    const diagnostics = await androidHomeEnvVariables.getDiagnostics(
      environmentInfo,
    );
    expect(typeof diagnostics.needsToBeFixed).toBe('string');
  });

  it('returns false if ANDROID_HOME is defined', async () => {
    process.env.ANDROID_HOME = '/fake/path/to/android/home';

    const environmentInfo: EnvironmentInfo = JSON.parse(
      await getEnvironmentInfo(),
    );
    const diagnostics = await androidHomeEnvVariables.getDiagnostics(
      environmentInfo,
    );
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('logs manual installation steps to the screen', async () => {
    // @ts-ignore
    const loader: Ora = {
      info: jest.fn(),
    };

    const environmentInfo: EnvironmentInfo = JSON.parse(
      await getEnvironmentInfo(),
    );

    androidHomeEnvVariables.runAutomaticFix({loader, environmentInfo});

    expect(logManualInstallation).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.resetAllMocks();
  });
});
