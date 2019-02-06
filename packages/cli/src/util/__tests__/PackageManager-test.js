// @flow
import ChildProcess from 'child_process';
import PackageManager from '../PackageManager';
import yarn from '../yarn';

const PROJECT_DIR = '/project/directory';
const PACKAGES = ['react', 'react-native'];
const PACKAGE = '@babel/core';
const EXEC_OPTS = { stdio: 'inherit' };

beforeEach(() => {
  jest.spyOn(ChildProcess, 'execSync').mockImplementation(() => {});
});

describe('yarn', () => {
  beforeEach(() => {
    jest
      .spyOn(yarn, 'getYarnVersionIfAvailable')
      .mockImplementation(() => true);
    jest.spyOn(yarn, 'isGlobalCliUsingYarn').mockImplementation(() => true);
  });

  it('should install', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR });

    uut.install(PACKAGES);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'yarn add react react-native',
      EXEC_OPTS
    );
  });

  it('should installDev', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR });

    uut.installDev(PACKAGES);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'yarn add -D react react-native',
      EXEC_OPTS
    );
  });

  it('should uninstall', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR });

    uut.uninstall(PACKAGE);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      `yarn remove ${PACKAGE}`,
      EXEC_OPTS
    );
  });
});

describe('npm', () => {
  it('should install', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR, forceNpm: true });

    uut.install(PACKAGES);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'npm install react react-native --save --save-exact',
      EXEC_OPTS
    );
  });

  it('should installDev', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR, forceNpm: true });

    uut.installDev(PACKAGES);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      'npm install react react-native --save-dev --save-exact',
      EXEC_OPTS
    );
  });

  it('should uninstall', () => {
    const uut = new PackageManager({ projectDir: PROJECT_DIR, forceNpm: true });

    uut.uninstall(PACKAGE);

    expect(ChildProcess.execSync).toHaveBeenCalledWith(
      `npm uninstall ${PACKAGE} --save`,
      EXEC_OPTS
    );
  });
});

it('should use npm if yarn is not available', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => false);
  const uut = new PackageManager({ projectDir: PROJECT_DIR });

  uut.install(PACKAGES);

  expect(ChildProcess.execSync).toHaveBeenCalledWith(
    `npm install react react-native --save --save-exact`,
    EXEC_OPTS
  );
});

it('should use npm if global cli is not using yarn', () => {
  jest.spyOn(yarn, 'isGlobalCliUsingYarn').mockImplementation(() => false);
  const uut = new PackageManager({ projectDir: PROJECT_DIR });

  uut.install(PACKAGES);

  expect(ChildProcess.execSync).toHaveBeenCalledWith(
    `npm install react react-native --save --save-exact`,
    EXEC_OPTS
  );
});
