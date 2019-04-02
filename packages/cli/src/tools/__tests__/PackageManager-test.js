// @flow
import ChildProcess from 'child_process';
import * as PackageManager from '../PackageManager';
import * as yarn from '../yarn';

const PACKAGES = ['react', 'react-native'];
const EXEC_OPTS = {stdio: 'inherit'};
const PROJECT_ROOT = '/some/dir';

beforeEach(() => {
  jest.spyOn(ChildProcess, 'execSync').mockImplementation(() => {});
});
afterEach(() => {
  (ChildProcess.execSync: any).mockRestore();
});

describe('yarn', () => {
  beforeEach(() => {
    jest
      .spyOn(yarn, 'getYarnVersionIfAvailable')
      .mockImplementation(() => true);
  });

  it('should install', () => {
    PackageManager.install(PACKAGES, {preferYarn: true});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'yarn add react react-native',
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {preferYarn: true});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'yarn add -D react react-native',
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: true});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'yarn remove react react-native',
      EXEC_OPTS,
    );
  });
});

describe('npm', () => {
  it('should install', () => {
    PackageManager.install(PACKAGES, {preferYarn: false});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'npm install react react-native --save --save-exact',
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {preferYarn: false});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'npm install react react-native --save-dev --save-exact',
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: false});

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'npm uninstall react react-native --save',
      EXEC_OPTS,
    );
  });
});

it('should use npm if yarn is not available', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => false);
  PackageManager.install(PACKAGES, {preferYarn: true});

  expect(ChildProcess.execSync).toHaveBeenCalledWith(
    'npm install react react-native --save --save-exact',
    EXEC_OPTS,
  );
});

it('should use npm if project is not using yarn', () => {
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => false);

  PackageManager.setProjectDir(PROJECT_ROOT);
  PackageManager.install(PACKAGES);

  expect(ChildProcess.execSync).toHaveBeenCalledWith(
    'npm install react react-native --save --save-exact',
    EXEC_OPTS,
  );
  expect(yarn.isProjectUsingYarn).toHaveBeenCalledWith(PROJECT_ROOT);
});

it('should use yarn if project is using yarn', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => true);
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => true);

  PackageManager.setProjectDir(PROJECT_ROOT);
  PackageManager.install(PACKAGES);

  expect(ChildProcess.execSync).toHaveBeenCalledWith(
    'yarn add react react-native',
    EXEC_OPTS,
  );
  expect(yarn.isProjectUsingYarn).toHaveBeenCalledWith(PROJECT_ROOT);
});
