import path from 'path';
import {cleanup, getTempDirectory, writeFiles} from '../../../../jest/helpers';
import installPods from '../tools/installPods';
import {execaPod} from '../tools/pods';

jest.mock('../tools/pods', () => ({
  execaPod: jest.fn(),
}));

jest.mock('../tools/runBundleInstall', () => jest.fn());

const DIR = getTempDirectory('install_pods_test');
const IOS_DIR = path.join(DIR, 'ios');
const originalCwd = process.cwd();

beforeEach(() => {
  cleanup(DIR);
  jest.resetAllMocks();
  process.chdir(originalCwd);

  writeFiles(DIR, {
    Gemfile: "source 'https://rubygems.org'",
    'ios/Podfile': 'platform :ios, "13.0"',
  });
});

afterEach(() => {
  process.chdir(originalCwd);
});

describe('installPods', () => {
  it('omits RCT_NEW_ARCH_ENABLED when new architecture value is unknown', async () => {
    (execaPod as jest.Mock).mockResolvedValue(undefined);

    await installPods(undefined, {
      iosFolderPath: IOS_DIR,
      skipBundleInstall: true,
    });

    expect(execaPod).toHaveBeenNthCalledWith(
      2,
      ['install'],
      expect.objectContaining({
        env: expect.not.objectContaining({
          RCT_NEW_ARCH_ENABLED: expect.anything(),
        }),
      }),
    );
  });

  it('keeps RCT_NEW_ARCH_ENABLED when new architecture value is known', async () => {
    (execaPod as jest.Mock).mockResolvedValue(undefined);

    await installPods(undefined, {
      iosFolderPath: IOS_DIR,
      skipBundleInstall: true,
      newArchEnabled: true,
    });

    expect(execaPod).toHaveBeenNthCalledWith(
      2,
      ['install'],
      expect.objectContaining({
        env: expect.objectContaining({
          RCT_NEW_ARCH_ENABLED: '1',
        }),
      }),
    );
  });
});
