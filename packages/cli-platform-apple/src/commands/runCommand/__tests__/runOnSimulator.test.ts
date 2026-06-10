import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {Device} from '../../../types';
import {runOnSimulator} from '../runOnSimulator';
import {buildProject} from '../../buildCommand/buildProject';
import installApp from '../installApp';
import {FlagsT} from '../createRun';

jest.mock('child_process');
jest.mock('fs', () => ({existsSync: jest.fn()}));
jest.mock('../../buildCommand/buildProject');
jest.mock('../installApp');

const xcodeProject: IOSProjectInfo = {
  name: 'TestApp.xcworkspace',
  path: '/path/to/TestApp.xcworkspace',
  isWorkspace: true,
};

const simulator: Device = {
  name: 'iPhone 15',
  udid: 'AAAA-BBBB-CCCC',
  state: 'Booted',
  type: 'simulator',
};

const args = {} as FlagsT;
const developerDir = '/Applications/Xcode.app/Contents/Developer';

beforeEach(() => {
  jest.clearAllMocks();
  (buildProject as jest.Mock).mockResolvedValue('');
  (installApp as jest.Mock).mockResolvedValue(undefined);
  (child_process.execFileSync as jest.Mock).mockReturnValue(
    `${developerDir}\n`,
  );
});

test('opens Simulator.app with the device UDID when it exists', async () => {
  (fs.existsSync as jest.Mock).mockImplementation((target) =>
    String(target).endsWith('Simulator.app'),
  );

  await runOnSimulator(
    xcodeProject,
    'ios',
    'Debug',
    'TestApp',
    args,
    simulator,
  );

  expect(child_process.execFileSync).toHaveBeenCalledWith('open', [
    `${developerDir}/Applications/Simulator.app`,
    '--args',
    '-CurrentDeviceUDID',
    simulator.udid,
  ]);
});

test('falls back to DeviceHub.app without the UDID when Simulator.app is absent', async () => {
  (fs.existsSync as jest.Mock).mockImplementation((target) =>
    String(target).endsWith('DeviceHub.app'),
  );

  await runOnSimulator(
    xcodeProject,
    'ios',
    'Debug',
    'TestApp',
    args,
    simulator,
  );

  const deviceHubPath = path.join(
    developerDir,
    '..',
    'Applications',
    'DeviceHub.app',
  );
  expect(child_process.execFileSync).toHaveBeenCalledWith('open', [
    deviceHubPath,
  ]);
  // DeviceHub cannot focus a specific device, so the UDID must not be passed.
  expect(child_process.execFileSync).not.toHaveBeenCalledWith(
    'open',
    expect.arrayContaining(['-CurrentDeviceUDID']),
  );
});

test('does not boot the simulator when it is already booted', async () => {
  (fs.existsSync as jest.Mock).mockReturnValue(true);

  await runOnSimulator(
    xcodeProject,
    'ios',
    'Debug',
    'TestApp',
    args,
    simulator,
  );

  expect(child_process.spawnSync).not.toHaveBeenCalledWith(
    'xcrun',
    expect.arrayContaining(['boot']),
  );
});
