import path from 'path';
import fs from 'fs';
import {getTempDirectory} from '../../../../../../jest/helpers';
import {BuildSettings} from '../getBuildSettings';
import {getBuildPath} from '../getBuildPath';

const targetBuildDirName = 'foo';
const targetBuildDirNameWithMaccatalyst = `${targetBuildDirName}-maccatalyst`;
const executableFolderPath = path.join('foo.app', 'Contents', 'MacOS', 'foo');

test('correctly determines macCatalyst build artifact path new style', async () => {
  // setup:
  const tmpBuildPath = getTempDirectory('maccatalyst-test-dir');
  fs.mkdirSync(path.join(tmpBuildPath, targetBuildDirNameWithMaccatalyst), {
    recursive: true,
  });

  // - create buildSettings object that represents this to CLI
  const buildSettings: BuildSettings = {
    TARGET_BUILD_DIR: path.join(
      tmpBuildPath,
      targetBuildDirNameWithMaccatalyst,
    ),
    EXECUTABLE_FOLDER_PATH: executableFolderPath,
    FULL_PRODUCT_NAME: 'unused-in-this-test',
    INFOPLIST_PATH: 'unused-in-this-test',
  };

  // test:
  // - send our buildSettings in and see what build path comes out
  const buildPath = await getBuildPath(buildSettings, 'ios', true);

  // assert:
  expect(buildPath).toBe(
    path.join(
      tmpBuildPath,
      targetBuildDirNameWithMaccatalyst,
      executableFolderPath,
    ),
  );
});

test('correctly determines macCatalyst build artifact path old style', async () => {
  // setup:
  const tmpBuildPath = getTempDirectory('maccatalyst-test-dir');
  fs.mkdirSync(path.join(tmpBuildPath, targetBuildDirNameWithMaccatalyst), {
    recursive: true,
  });

  // - create buildSettings object that represents this to CLI
  // FIXME get the build settings as side effect from project definition,
  //       because it's the translation of project settings to path that fails
  const buildSettings: BuildSettings = {
    TARGET_BUILD_DIR: path.join(tmpBuildPath, targetBuildDirName),
    EXECUTABLE_FOLDER_PATH: executableFolderPath,
    FULL_PRODUCT_NAME: 'unused-in-this-test',
    INFOPLIST_PATH: 'unused-in-this-test',
  };

  // test:
  // - send our buildSettings in and see what build path comes out
  const buildPath = await getBuildPath(buildSettings, 'ios', true);

  // assert:
  expect(buildPath).toBe(
    path.join(
      tmpBuildPath,
      targetBuildDirNameWithMaccatalyst,
      executableFolderPath,
    ),
  );
});

test('correctly determines iOS build artifact path', async () => {
  // setup:
  const tmpBuildPath = getTempDirectory('ios-test-dir');
  fs.mkdirSync(path.join(tmpBuildPath, targetBuildDirName), {
    recursive: true,
  });

  // - create buildSettings object that represents this to CLI
  const buildSettings: BuildSettings = {
    TARGET_BUILD_DIR: path.join(tmpBuildPath, targetBuildDirName),
    EXECUTABLE_FOLDER_PATH: executableFolderPath,
    FULL_PRODUCT_NAME: 'unused-in-this-test',
    INFOPLIST_PATH: 'unused-in-this-test',
  };

  // test:
  // - send our buildSettings in and see what build path comes out
  const buildPath = await getBuildPath(buildSettings);

  // assert:
  expect(buildPath).toBe(
    path.join(tmpBuildPath, targetBuildDirName, executableFolderPath),
  );
});
