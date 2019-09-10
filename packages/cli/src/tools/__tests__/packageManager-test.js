// @flow
jest.mock('execa', () => jest.fn());
import execa from 'execa';
// $FlowFixMe - converted to TS
import * as yarn from '../yarn';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../packageManager';

const PACKAGES = ['react', 'react-native'];
const EXEC_OPTS = {stdio: 'inherit'};
const PROJECT_ROOT = '/some/dir';

afterEach(() => {
  jest.resetAllMocks();
});

describe('yarn', () => {
  beforeEach(() => {
    jest
      .spyOn(yarn, 'getYarnVersionIfAvailable')
      .mockImplementation(() => true);

    jest.spyOn(logger, 'isVerbose').mockImplementation(() => false);
  });

  it('should install', () => {
    PackageManager.install(PACKAGES, {preferYarn: true});

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], EXEC_OPTS);
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {preferYarn: true});

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['add', '-D', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: true});

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['remove', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

describe('npm', () => {
  it('should install', () => {
    PackageManager.install(PACKAGES, {preferYarn: false});

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {preferYarn: false});

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save-dev', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: false});

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '--save', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

it('should use npm if yarn is not available', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => false);
  PackageManager.install(PACKAGES, {preferYarn: true});

  expect(execa).toHaveBeenCalledWith(
    'npm',
    ['install', '--save', '--save-exact', ...PACKAGES],
    EXEC_OPTS,
  );
});

it('should use npm if project is not using yarn', () => {
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => false);

  PackageManager.setProjectDir(PROJECT_ROOT);
  PackageManager.install(PACKAGES);

  expect(execa).toHaveBeenCalledWith(
    'npm',
    ['install', '--save', '--save-exact', ...PACKAGES],
    EXEC_OPTS,
  );
  expect(yarn.isProjectUsingYarn).toHaveBeenCalledWith(PROJECT_ROOT);
});

it('should use yarn if project is using yarn', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => true);
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => true);

  PackageManager.setProjectDir(PROJECT_ROOT);
  PackageManager.install(PACKAGES);

  expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], EXEC_OPTS);
  expect(yarn.isProjectUsingYarn).toHaveBeenCalledWith(PROJECT_ROOT);
});

test.each([[false, 'pipe'], [true, 'inherit']])(
  'when verbose is set to %s should use "%s" stdio',
  (isVerbose: boolean, stdioType: string) => {
    jest
      .spyOn(yarn, 'getYarnVersionIfAvailable')
      .mockImplementation(() => true);
    jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => true);
    jest.spyOn(logger, 'isVerbose').mockImplementation(() => isVerbose);

    PackageManager.install(PACKAGES, {silent: true});

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], {
      stdio: stdioType,
    });
  },
);
