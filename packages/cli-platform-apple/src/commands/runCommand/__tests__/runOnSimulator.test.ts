import child_process from 'child_process';
import fs from 'fs';
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

test('falls back to DeviceHub via devices:// deep link when Simulator.app is absent', async () => {
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

  // DeviceHub registers the `devices://` URL scheme, which focuses the device by UDID.
  expect(child_process.execFileSync).toHaveBeenCalledWith('open', [
    `devices://device/open?id=${simulator.udid}`,
  ]);
  // The deep link replaces the Simulator.app `-CurrentDeviceUDID` argument.
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

test('boots a shut-down simulator before opening it in DeviceHub', async () => {
  (fs.existsSync as jest.Mock).mockImplementation((target) =>
    String(target).endsWith('DeviceHub.app'),
  );

  await runOnSimulator(xcodeProject, 'ios', 'Debug', 'TestApp', args, {
    ...simulator,
    state: 'Shutdown',
  });

  const spawnSync = child_process.spawnSync as jest.Mock;
  const execFileSync = child_process.execFileSync as jest.Mock;
  const bootCall = spawnSync.mock.calls.findIndex(([, cmdArgs]) =>
    cmdArgs.includes('boot'),
  );
  const openCall = execFileSync.mock.calls.findIndex(([, cmdArgs]) =>
    String(cmdArgs?.[0]).startsWith('devices://'),
  );

  expect(bootCall).not.toBe(-1);
  expect(openCall).not.toBe(-1);
  // DeviceHub shows no window for a device that starts booting right after
  // the deep link is opened, so the device has to be booted first.
  expect(spawnSync.mock.invocationCallOrder[bootCall]).toBeLessThan(
    execFileSync.mock.invocationCallOrder[openCall],
  );
});
