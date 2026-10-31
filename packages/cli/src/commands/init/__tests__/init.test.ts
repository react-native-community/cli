import fs from 'fs';
import path from 'path';
import execa from 'execa';
import * as cliTools from '@react-native-community/cli-tools';
import {installPods} from '@react-native-community/cli-platform-apple';
import {runCodegen} from '@react-native-community/cli-config-apple';
import {
  cleanup,
  getTempDirectory,
  writeFiles,
} from '../../../../../../jest/helpers';
import * as PackageManager from '../../../tools/packageManager';
import {npmResolveConcreteVersion} from '../../../tools/npm';
import {installTemplatePackage, getTemplateConfig} from '../template';
import {createTemplateUri} from '../version';
import {checkGitInstallation} from '../git';
import printRunInstructions from '../printRunInstructions';
import initialize from '../init';
import type {Options} from '../types';

jest.mock('execa', () => jest.fn());
jest.mock('@react-native-community/cli-tools', () => ({
  ...jest.requireActual('@react-native-community/cli-tools'),
  logger: {
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isVerbose: jest.fn(),
  },
  prompt: jest.fn(),
  getLoader: jest.fn(),
  cacheManager: {removeProjectCache: jest.fn(), set: jest.fn()},
}));
jest.mock('@react-native-community/cli-platform-apple', () => ({
  installPods: jest.fn(),
}));
jest.mock('@react-native-community/cli-config-apple', () => ({
  runCodegen: jest.fn(),
}));
jest.mock('../../../tools/npm', () => ({
  npmResolveConcreteVersion: jest.fn(),
}));
jest.mock('../version', () => ({
  createTemplateUri: jest.fn(),
}));
jest.mock('../git', () => ({
  checkGitInstallation: jest.fn(),
}));
jest.mock('../template');
jest.mock('../editTemplate');
jest.mock('../printRunInstructions');

const PROJECT_NAME = 'TestApp';
const POD_PROMPT = 'Do you want to install CocoaPods now?';

const originalPlatform = process.platform;
const originalCwd = process.cwd();

// A directory per test, because module resolution results are cached per path.
let rootCount = 0;
let ROOT: string;
let PROJECT_DIR: string;

function promptMessages() {
  return (cliTools.prompt as jest.Mock).mock.calls.map(([{message}]) =>
    String(message),
  );
}

function installReactNative({withSpmScript}: {withSpmScript: boolean}) {
  jest
    .spyOn(PackageManager, 'installAll')
    .mockImplementation(async ({root}) => {
      writeFiles(root, {
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
      return undefined as unknown as execa.ExecaReturnValue;
    });
}

function init(options: Partial<Options> = {}) {
  return initialize([PROJECT_NAME], options as Options);
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
  Object.defineProperty(process, 'platform', {value: 'darwin'});

  const directory = getTempDirectory(`init-wiring-${++rootCount}`);
  fs.mkdirSync(directory, {recursive: true});
  ROOT = fs.realpathSync(directory);
  PROJECT_DIR = path.join(ROOT, PROJECT_NAME);
  process.chdir(ROOT);

  (npmResolveConcreteVersion as jest.Mock).mockResolvedValue('0.88.0');
  (createTemplateUri as jest.Mock).mockResolvedValue('template-uri');
  (checkGitInstallation as jest.Mock).mockResolvedValue(false);
  (installTemplatePackage as jest.Mock).mockImplementation(
    async (_uri: string, templateSourceDir: string) => {
      writeFiles(templateSourceDir, {
        'package.json': JSON.stringify({dependencies: {template: '*'}}),
      });
    },
  );
  (getTemplateConfig as jest.Mock).mockReturnValue({
    placeholderName: 'HelloWorld',
    templateDir: 'template',
  });
  (execa as unknown as jest.Mock).mockResolvedValue({exitCode: 0});
  (cliTools.getLoader as jest.Mock).mockReturnValue(new cliTools.NoopLoader());
  (cliTools.prompt as jest.Mock).mockResolvedValue({installCocoapods: true});
  jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
});

afterEach(() => {
  process.chdir(originalCwd);
  cleanup(ROOT);
});

afterAll(() => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
});

describe('init on macOS', () => {
  it('sets up SwiftPM instead of CocoaPods when react-native ships the script', async () => {
    installReactNative({withSpmScript: true});

    await init();

    expect(execa).toHaveBeenCalledWith(
      process.execPath,
      [
        path.join(
          PROJECT_DIR,
          'node_modules/react-native/scripts/setup-apple-spm.js',
        ),
        'add',
        '--deintegrate',
        '--yes',
      ],
      expect.objectContaining({cwd: PROJECT_DIR}),
    );
    expect(installPods).not.toHaveBeenCalled();
    expect(runCodegen).not.toHaveBeenCalled();
    expect(promptMessages()).not.toContainEqual(
      expect.stringContaining(POD_PROMPT),
    );
    expect(printRunInstructions).toHaveBeenCalledWith(
      PROJECT_DIR,
      PROJECT_NAME,
      expect.objectContaining({spmSetup: 'done'}),
    );
  });

  it('asks the user to retry SwiftPM when the setup fails', async () => {
    installReactNative({withSpmScript: true});
    (execa as unknown as jest.Mock).mockImplementation(async (command) => {
      if (command === process.execPath) {
        throw new Error('Command failed with exit code 1');
      }
      return {exitCode: 0};
    });

    await init();

    expect(printRunInstructions).toHaveBeenCalledWith(
      PROJECT_DIR,
      PROJECT_NAME,
      expect.objectContaining({spmSetup: 'failed'}),
    );
  });

  it('leaves SwiftPM pending with --skip-install', async () => {
    installReactNative({withSpmScript: true});

    await init({skipInstall: true});

    expect(PackageManager.installAll).not.toHaveBeenCalled();
    expect(execa).not.toHaveBeenCalledWith(
      process.execPath,
      expect.anything(),
      expect.anything(),
    );
    expect(printRunInstructions).toHaveBeenCalledWith(
      PROJECT_DIR,
      PROJECT_NAME,
      expect.objectContaining({spmSetup: 'pending'}),
    );
  });

  it.each([
    ['react-native does not ship the script', false, {}],
    ['--skip-spm is given', true, {skipSpm: true}],
  ])(
    'offers CocoaPods when %s',
    async (_label, withSpmScript, options: Partial<Options>) => {
      installReactNative({withSpmScript});

      await init(options);

      expect(promptMessages()).toContainEqual(
        expect.stringContaining(POD_PROMPT),
      );
      expect(runCodegen).toHaveBeenCalled();
      expect(installPods).toHaveBeenCalled();
      expect(execa).not.toHaveBeenCalledWith(
        process.execPath,
        expect.anything(),
        expect.anything(),
      );
      expect(printRunInstructions).toHaveBeenCalledWith(
        PROJECT_DIR,
        PROJECT_NAME,
        expect.objectContaining({spmSetup: undefined}),
      );
    },
  );

  it.each([true, 'true'])(
    'rejects --install-pods %p for React Native 0.87+ before creating the project',
    async (installPodsFlag) => {
      installReactNative({withSpmScript: true});

      await expect(init({installPods: installPodsFlag})).rejects.toThrow(
        '--skip-spm',
      );

      expect(fs.existsSync(PROJECT_DIR)).toBe(false);
      expect(installTemplatePackage).not.toHaveBeenCalled();
      expect(PackageManager.installAll).not.toHaveBeenCalled();
    },
  );

  describe.each([
    ['--template', {template: 'my-template'}],
    ['an out-of-tree --platform-name', {platformName: 'react-native-macos'}],
  ])('with %s', (_label, versionUnknownOptions: Partial<Options>) => {
    it('keeps CocoaPods for --install-pods true', async () => {
      installReactNative({withSpmScript: true});

      await init({...versionUnknownOptions, installPods: true});

      expect(installPods).toHaveBeenCalled();
      expect(execa).not.toHaveBeenCalledWith(
        process.execPath,
        expect.anything(),
        expect.anything(),
      );
      expect(printRunInstructions).toHaveBeenCalledWith(
        PROJECT_DIR,
        PROJECT_NAME,
        expect.objectContaining({spmSetup: undefined}),
      );
    });

    it('sets up SwiftPM when react-native ships the script', async () => {
      installReactNative({withSpmScript: true});

      await init(versionUnknownOptions);

      expect(execa).toHaveBeenCalledWith(
        process.execPath,
        expect.arrayContaining(['add', '--deintegrate', '--yes']),
        expect.objectContaining({cwd: PROJECT_DIR}),
      );
      expect(installPods).not.toHaveBeenCalled();
      expect(printRunInstructions).toHaveBeenCalledWith(
        PROJECT_DIR,
        PROJECT_NAME,
        expect.objectContaining({spmSetup: 'done'}),
      );
    });
  });
});
