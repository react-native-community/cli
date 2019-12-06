jest.mock('execa', () => jest.fn());
import execa from 'execa';
import * as yarn from '../yarn';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '../packageManager';

const PACKAGES = ['react', 'react-native'];
const PROJECT_ROOT = '/some/dir';
const EXEC_OPTS = {stdio: 'inherit', cwd: PROJECT_ROOT};

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
    PackageManager.install(PACKAGES, {preferYarn: true, root: PROJECT_ROOT});

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], EXEC_OPTS);
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {preferYarn: true, root: PROJECT_ROOT});

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['add', '-D', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: true, root: PROJECT_ROOT});

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['remove', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

describe('npm', () => {
  it('should install', () => {
    PackageManager.install(PACKAGES, {preferYarn: false, root: PROJECT_ROOT});

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {
      preferYarn: false,
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save-dev', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {preferYarn: false, root: PROJECT_ROOT});

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '--save', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

it('should use npm if yarn is not available', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => false);
  PackageManager.install(PACKAGES, {preferYarn: true, root: PROJECT_ROOT});

  expect(execa).toHaveBeenCalledWith(
    'npm',
    ['install', '--save', '--save-exact', ...PACKAGES],
    EXEC_OPTS,
  );
});

it('should use npm if project is not using yarn', () => {
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => false);

  PackageManager.install(PACKAGES, {root: PROJECT_ROOT});

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

  PackageManager.install(PACKAGES, {root: PROJECT_ROOT});

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

    PackageManager.install(PACKAGES, {root: PROJECT_ROOT, silent: true});

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], {
      stdio: stdioType,
      cwd: PROJECT_ROOT,
    });
  },
);
