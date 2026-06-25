/// <reference types="jest" />
import {Config} from '@react-native-community/cli-types';
import createRun from '../createRun';
import listDevices from '../../../tools/listDevices';
import {runOnSimulator} from '../runOnSimulator';
import {runOnDevice} from '../runOnDevice';
import {getXcodeProjectAndDir} from '../../buildCommand/getXcodeProjectAndDir';
import {getConfiguration} from '../../buildCommand/getConfiguration';
import {getFallbackSimulator} from '../getFallbackSimulator';
import {Device} from '../../../types';
import path from 'path';

const packageRoot = path.resolve(__dirname, '../../../../');

jest.mock('../../../tools/listDevices');
jest.mock('../runOnSimulator');
jest.mock('../runOnDevice');
jest.mock('../../buildCommand/getXcodeProjectAndDir');
jest.mock('../../buildCommand/getConfiguration');
jest.mock('../getFallbackSimulator');

const fallbackSimulator: Device = {
  name: 'iPhone 14',
  udid: 'FALLBACK-SIM-UDID',
  type: 'simulator',
  state: 'Shutdown',
  version: '17.0',
};

const bootedSimulator: Device = {
  name: 'iPhone 17',
  udid: 'BOOTED-SIM-UDID',
  type: 'simulator',
  state: 'Booted',
  version: '26.2',
};

const physicalDevice: Device = {
  name: 'Stefan’s iPhone 16',
  udid: 'PHYSICAL-DEVICE-UDID',
  type: 'device',
};

function buildCtx(): Config {
  return {
    root: packageRoot,
    reactNativePath: '',
    reactNativeVersion: 'unknown',
    project: {
      ios: {
        sourceDir: packageRoot,
        automaticPodsInstallation: false,
      },
    },
    dependencies: {},
  } as unknown as Config;
}

function buildArgs(overrides: Record<string, unknown> = {}) {
  return {
    packager: false,
    port: 8081,
    terminal: undefined,
    listDevices: false,
    interactive: false,
    onlyPods: false,
    forcePods: false,
    ...overrides,
  } as any;
}

describe('createRun no-flag default targeting (issue #2765)', () => {
  let chdirSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    chdirSpy = jest.spyOn(process, 'chdir').mockImplementation(() => {});
    (getXcodeProjectAndDir as jest.Mock).mockReturnValue({
      xcodeProject: {name: 'Demo', isWorkspace: true},
      sourceDir: packageRoot,
    });
    (getConfiguration as jest.Mock).mockResolvedValue({
      mode: 'Debug',
      scheme: 'Demo',
    });
    (getFallbackSimulator as jest.Mock).mockReturnValue(fallbackSimulator);
    (runOnSimulator as jest.Mock).mockResolvedValue(undefined);
    (runOnDevice as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    chdirSpy.mockRestore();
  });

  test('connected iPhone + no booted simulator + no flags -> launches fallback simulator only', async () => {
    (listDevices as jest.Mock).mockResolvedValue([physicalDevice]);

    await createRun({platformName: 'ios'})([], buildCtx(), buildArgs());

    expect(runOnSimulator).toHaveBeenCalledTimes(1);
    expect(runOnSimulator).toHaveBeenCalledWith(
      expect.anything(),
      'ios',
      'Debug',
      'Demo',
      expect.anything(),
      fallbackSimulator,
    );
    expect(runOnDevice).not.toHaveBeenCalled();
  });

  test('connected iPhone + booted simulator + no flags -> launches booted simulator only', async () => {
    (listDevices as jest.Mock).mockResolvedValue([
      physicalDevice,
      bootedSimulator,
    ]);

    await createRun({platformName: 'ios'})([], buildCtx(), buildArgs());

    expect(runOnSimulator).toHaveBeenCalledTimes(1);
    expect(runOnSimulator).toHaveBeenCalledWith(
      expect.anything(),
      'ios',
      'Debug',
      'Demo',
      expect.anything(),
      bootedSimulator,
    );
    expect(runOnDevice).not.toHaveBeenCalled();
  });

  test('connected iPhone + --device "name" -> runs on the physical device', async () => {
    (listDevices as jest.Mock).mockResolvedValue([
      physicalDevice,
      bootedSimulator,
    ]);

    await createRun({platformName: 'ios'})(
      [],
      buildCtx(),
      buildArgs({device: physicalDevice.name}),
    );

    expect(runOnDevice).toHaveBeenCalledTimes(1);
    expect(runOnDevice).toHaveBeenCalledWith(
      physicalDevice,
      'ios',
      'Debug',
      'Demo',
      expect.anything(),
      expect.anything(),
    );
    expect(runOnSimulator).not.toHaveBeenCalled();
  });

  test('no devices, no flags -> launches fallback simulator', async () => {
    (listDevices as jest.Mock).mockResolvedValue([fallbackSimulator]);

    await createRun({platformName: 'ios'})([], buildCtx(), buildArgs());

    expect(runOnSimulator).toHaveBeenCalledTimes(1);
    expect(runOnSimulator).toHaveBeenCalledWith(
      expect.anything(),
      'ios',
      'Debug',
      'Demo',
      expect.anything(),
      fallbackSimulator,
    );
    expect(runOnDevice).not.toHaveBeenCalled();
  });
});
