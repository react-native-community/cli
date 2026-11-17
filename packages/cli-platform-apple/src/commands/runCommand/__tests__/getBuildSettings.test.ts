import child_process from 'child_process';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {getBuildSettings} from '../getBuildSettings';

jest.mock('child_process');

const xcodeProject: IOSProjectInfo = {
  name: 'TestApp.xcworkspace',
  path: '/path/to/TestApp.xcworkspace',
  isWorkspace: true,
};

const buildOutput = 'export PLATFORM_NAME=iphonesimulator\n';

beforeEach(() => {
  jest.clearAllMocks();
  (child_process.execFileSync as jest.Mock).mockReturnValue(
    JSON.stringify([
      {
        target: 'TestApp',
        buildSettings: {
          WRAPPER_EXTENSION: 'app',
          TARGET_BUILD_DIR: '/build/Products/Debug-iphonesimulator',
        },
      },
    ]),
  );
});

test('queries build settings from the default derived data path when no build folder is given', async () => {
  await getBuildSettings(xcodeProject, 'Debug', buildOutput, 'TestApp');

  expect(child_process.execFileSync).toHaveBeenCalledWith(
    'xcodebuild',
    expect.not.arrayContaining(['-derivedDataPath']),
    {encoding: 'utf8'},
  );
});

test('queries build settings from the build folder when one is given', async () => {
  await getBuildSettings(
    xcodeProject,
    'Debug',
    buildOutput,
    'TestApp',
    undefined,
    'build/DerivedData',
  );

  expect(child_process.execFileSync).toHaveBeenCalledWith(
    'xcodebuild',
    [
      '-workspace',
      'TestApp.xcworkspace',
      '-scheme',
      'TestApp',
      '-sdk',
      'iphonesimulator',
      '-configuration',
      'Debug',
      '-derivedDataPath',
      'build/DerivedData',
      '-showBuildSettings',
      '-json',
    ],
    {encoding: 'utf8'},
  );
});
