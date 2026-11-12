import fs from 'fs';
import path from 'path';
import execa from 'execa';
import {CLIError, logger, NoopLoader} from '@react-native-community/cli-tools';
import {
  findPodRunner,
  installCocoaPods,
} from '@react-native-community/cli-config-apple';
import {
  cleanup,
  getTempDirectory,
  writeFiles,
} from '../../../../../../jest/helpers';
import {
  assertNoSpmConflict,
  findSpmSetupScript,
  getTemplateReactNativeVersion,
  isSpmExpected,
  runSpmSetup,
} from '../spm';

jest.mock('execa', () => jest.fn());
jest.mock('@react-native-community/cli-config-apple', () => ({
  findPodRunner: jest.fn(),
  installCocoaPods: jest.fn(),
}));

// A directory per test, because module resolution results are cached per path.
let projectCount = 0;
let PROJECT_DIR: string;
let SCRIPT_PATH: string;

const originalPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', {value: platform});
}

function writeReactNative({withSpmScript}: {withSpmScript: boolean}) {
  writeFiles(PROJECT_DIR, {
    'node_modules/react-native/package.json': JSON.stringify({
      name: 'react-native',
      main: './index.js',
      exports: {
        '.': './index.js',
        './scripts/*': './scripts/*.js',
        './package.json': './package.json',
      },
    }),
    'node_modules/react-native/index.js': '',
    ...(withSpmScript
      ? {'node_modules/react-native/scripts/setup-apple-spm.js': ''}
      : {}),
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  setPlatform('darwin');
  const directory = getTempDirectory(`init-spm-project-${++projectCount}`);
  fs.mkdirSync(directory, {recursive: true});
  PROJECT_DIR = fs.realpathSync(directory);
  SCRIPT_PATH = path.join(
    PROJECT_DIR,
    'node_modules',
    'react-native',
    'scripts',
    'setup-apple-spm.js',
  );
});

afterEach(() => {
  cleanup(PROJECT_DIR);
});

afterAll(() => {
  setPlatform(originalPlatform);
});

describe('findSpmSetupScript', () => {
  it('returns the script shipped with react-native on macOS', () => {
    writeReactNative({withSpmScript: true});

    expect(findSpmSetupScript(PROJECT_DIR, {})).toBe(SCRIPT_PATH);
  });

  it('returns undefined when react-native does not ship the script', () => {
    writeReactNative({withSpmScript: false});

    expect(findSpmSetupScript(PROJECT_DIR, {})).toBeUndefined();
  });

  it('returns undefined when react-native is not installed', () => {
    writeFiles(PROJECT_DIR, {'package.json': '{}'});

    expect(findSpmSetupScript(PROJECT_DIR, {})).toBeUndefined();
  });

  it('returns undefined outside macOS', () => {
    writeReactNative({withSpmScript: true});
    setPlatform('linux');

    expect(findSpmSetupScript(PROJECT_DIR, {})).toBeUndefined();
  });

  it('returns undefined with --skip-spm', () => {
    writeReactNative({withSpmScript: true});

    expect(findSpmSetupScript(PROJECT_DIR, {skipSpm: true})).toBeUndefined();
  });

  it('returns undefined with --skip-install', () => {
    writeReactNative({withSpmScript: true});

    expect(
      findSpmSetupScript(PROJECT_DIR, {skipInstall: true}),
    ).toBeUndefined();
  });

  it.each([true, 'true'])(
    'returns undefined with --install-pods %p',
    (installPods) => {
      writeReactNative({withSpmScript: true});

      expect(findSpmSetupScript(PROJECT_DIR, {installPods})).toBeUndefined();
    },
  );

  it.each([false, 'false'])(
    'returns the script with --install-pods %p',
    (installPods) => {
      writeReactNative({withSpmScript: true});

      expect(findSpmSetupScript(PROJECT_DIR, {installPods})).toBe(SCRIPT_PATH);
    },
  );
});

describe('runSpmSetup', () => {
  const SCRIPT_ARGS = () => [SCRIPT_PATH, 'add', '--deintegrate', '--yes'];

  beforeEach(() => {
    (findPodRunner as jest.Mock).mockResolvedValue('system');
    (execa as unknown as jest.Mock).mockResolvedValue({exitCode: 0});
  });

  it('runs the script as a child process in the project directory', async () => {
    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(true);
    expect(findPodRunner).toHaveBeenCalledWith({cwd: PROJECT_DIR});
    expect(execa).toHaveBeenCalledWith(
      process.execPath,
      SCRIPT_ARGS(),
      expect.objectContaining({cwd: PROJECT_DIR}),
    );
    expect(installCocoaPods).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("runs the script under bundle exec to use the project's bundled CocoaPods", async () => {
    (findPodRunner as jest.Mock).mockResolvedValue('bundle');

    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(true);
    expect(execa).toHaveBeenCalledWith(
      'bundle',
      ['exec', process.execPath, ...SCRIPT_ARGS()],
      expect.objectContaining({cwd: PROJECT_DIR}),
    );
  });

  it('installs CocoaPods when it is not available, then runs the script', async () => {
    (findPodRunner as jest.Mock)
      .mockRejectedValueOnce(new Error('cocoapods not installed'))
      .mockResolvedValueOnce('system');

    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(true);
    expect(installCocoaPods).toHaveBeenCalledTimes(1);
    expect(execa).toHaveBeenCalledWith(
      process.execPath,
      SCRIPT_ARGS(),
      expect.objectContaining({cwd: PROJECT_DIR}),
    );
  });

  it('does not run the script when CocoaPods cannot be installed', async () => {
    (findPodRunner as jest.Mock).mockRejectedValue(
      new Error('cocoapods not installed'),
    );
    (installCocoaPods as jest.Mock).mockRejectedValue(
      new CLIError('An error occured while trying to install CocoaPods'),
    );

    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(false);
    expect(execa).not.toHaveBeenCalled();
    const warning = (logger.warn as jest.Mock).mock.calls.flat().join('\n');
    expect(warning).toContain('the iOS project still uses CocoaPods');
    expect(warning).toContain('npx react-native spm add --deintegrate');
    expect(warning).toContain(
      'An error occured while trying to install CocoaPods',
    );
  });

  it('does not run the script when CocoaPods is still missing after installing it', async () => {
    (findPodRunner as jest.Mock).mockRejectedValue(
      new Error('cocoapods not installed'),
    );

    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(false);
    expect(installCocoaPods).toHaveBeenCalledTimes(1);
    expect(execa).not.toHaveBeenCalled();
    const warning = (logger.warn as jest.Mock).mock.calls.flat().join('\n');
    expect(warning).toContain('the iOS project still uses CocoaPods');
    expect(warning).toContain('cocoapods not installed');
  });

  it('warns with the retry command and does not throw when the script fails', async () => {
    (execa as unknown as jest.Mock).mockRejectedValue(
      new Error('Command failed with exit code 1'),
    );

    const didSetUp = await runSpmSetup(
      SCRIPT_PATH,
      PROJECT_DIR,
      new NoopLoader(),
    );

    expect(didSetUp).toBe(false);
    const warning = (logger.warn as jest.Mock).mock.calls.flat().join('\n');
    expect(warning).toContain('Command failed with exit code 1');
    expect(warning).toContain('npx react-native spm add --deintegrate');
    expect(warning).toContain(
      'Project initialization continues, but the iOS project may be partly converted.',
    );
  });
});

describe('getTemplateReactNativeVersion', () => {
  it('returns the resolved version for the default template', () => {
    expect(getTemplateReactNativeVersion({}, '0.88.1')).toBe('0.88.1');
  });

  it('returns undefined when a custom template picks the version', () => {
    expect(
      getTemplateReactNativeVersion({template: 'my-template'}, '0.88.1'),
    ).toBeUndefined();
  });

  it('returns undefined for an out-of-tree platform', () => {
    expect(
      getTemplateReactNativeVersion(
        {platformName: 'react-native-macos'},
        '0.88.1',
      ),
    ).toBeUndefined();
  });

  it('returns undefined when the version could not be resolved', () => {
    expect(getTemplateReactNativeVersion({}, 'latest')).toBeUndefined();
  });
});

describe('isSpmExpected', () => {
  it.each([
    ['0.87.0', true],
    ['0.87.0-rc.1', true],
    ['0.88.1', true],
    ['0.86.2', false],
    [undefined, false],
  ])('for React Native %p returns %p', (reactNativeVersion, expected) => {
    expect(isSpmExpected(reactNativeVersion, {})).toBe(expected);
  });

  it('returns false with --skip-spm', () => {
    expect(isSpmExpected('0.88.1', {skipSpm: true})).toBe(false);
  });

  it('returns false outside macOS', () => {
    setPlatform('linux');

    expect(isSpmExpected('0.88.1', {})).toBe(false);
  });
});

describe('assertNoSpmConflict', () => {
  const versions: Array<[string, string | undefined, boolean]> = [
    ['>= 0.87', '0.87.0', true],
    ['>= 0.87 (nightly)', '0.88.0-nightly-20261001-abcdef', true],
    ['< 0.87', '0.86.2', false],
    ['unknown', undefined, false],
  ];

  describe.each(versions)(
    'with React Native %s',
    (_label, reactNativeVersion, spmExpected) => {
      it.each([true, 'true'])(
        `${spmExpected ? 'throws' : 'does not throw'} with --install-pods %p`,
        (installPods) => {
          const check = () =>
            assertNoSpmConflict(reactNativeVersion, {installPods});
          if (spmExpected) {
            expect(check).toThrow(CLIError);
            expect(check).toThrow('--skip-spm');
            expect(check).toThrow('or remove --install-pods');
          } else {
            expect(check).not.toThrow();
          }
        },
      );

      it.each([false, 'false', undefined])(
        'does not throw with --install-pods %p',
        (installPods) => {
          expect(() =>
            assertNoSpmConflict(reactNativeVersion, {installPods}),
          ).not.toThrow();
        },
      );

      it.each([true, 'true'])(
        'does not throw with --install-pods %p and --skip-spm',
        (installPods) => {
          expect(() =>
            assertNoSpmConflict(reactNativeVersion, {
              installPods,
              skipSpm: true,
            }),
          ).not.toThrow();
        },
      );
    },
  );

  it('does not throw with --install-pods true and --skip-install', () => {
    expect(() =>
      assertNoSpmConflict('0.88.1', {installPods: true, skipInstall: true}),
    ).not.toThrow();
  });

  it('does not throw outside macOS', () => {
    setPlatform('linux');

    expect(() =>
      assertNoSpmConflict('0.88.1', {installPods: true}),
    ).not.toThrow();
  });
});
