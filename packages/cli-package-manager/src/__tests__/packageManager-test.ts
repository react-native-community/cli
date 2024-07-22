jest.mock('execa', () => jest.fn());
import execa from 'execa';
import * as yarn from '../yarn';
import * as bun from '../bun';
import {logger} from '@react-native-community/cli-tools';
import * as PackageManager from '..';

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
    jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => true);

    jest.spyOn(logger, 'isVerbose').mockImplementation(() => false);
  });

  it('should install', () => {
    PackageManager.install(PACKAGES, {
      packageManager: 'yarn',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], EXEC_OPTS);
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {
      packageManager: 'yarn',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['add', '-D', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {
      packageManager: 'yarn',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['remove', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

describe('npm', () => {
  it('should install', () => {
    PackageManager.install(PACKAGES, {
      packageManager: 'npm',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    PackageManager.installDev(PACKAGES, {
      packageManager: 'npm',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save-dev', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    PackageManager.uninstall(PACKAGES, {
      packageManager: 'npm',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '--save', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

describe('bun', () => {
  it('should install', () => {
    jest.spyOn(bun, 'getBunVersionIfAvailable').mockImplementation(() => true);
    jest
      .spyOn(bun, 'isProjectUsingBun')
      .mockImplementation(() => './path/to/bun.lockb');
    PackageManager.install(PACKAGES, {
      packageManager: 'bun',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'bun',
      ['add', '--exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should installDev', () => {
    jest.spyOn(bun, 'getBunVersionIfAvailable').mockImplementation(() => true);
    jest
      .spyOn(bun, 'isProjectUsingBun')
      .mockImplementation(() => './path/to/bun.lockb');
    PackageManager.installDev(PACKAGES, {
      packageManager: 'bun',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'bun',
      ['add', '--dev', '--exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should uninstall', () => {
    jest.spyOn(bun, 'getBunVersionIfAvailable').mockImplementation(() => true);
    jest
      .spyOn(bun, 'isProjectUsingBun')
      .mockImplementation(() => './path/to/bun.lockb');
    PackageManager.uninstall(PACKAGES, {
      packageManager: 'bun',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'bun',
      ['remove', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should use npm if bun is not available', () => {
    jest.spyOn(bun, 'getBunVersionIfAvailable').mockImplementation(() => false);
    PackageManager.install(PACKAGES, {
      packageManager: 'bun',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });

  it('should use npm if bun bun.lockb is not found', () => {
    jest.spyOn(bun, 'isProjectUsingBun').mockImplementation(() => false);
    PackageManager.install(PACKAGES, {
      packageManager: 'bun',
      root: PROJECT_ROOT,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install', '--save', '--save-exact', ...PACKAGES],
      EXEC_OPTS,
    );
  });
});

it('should use npm if yarn is not available', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => false);
  PackageManager.install(PACKAGES, {
    packageManager: 'yarn',
    root: PROJECT_ROOT,
  });

  expect(execa).toHaveBeenCalledWith(
    'npm',
    ['install', '--save', '--save-exact', ...PACKAGES],
    EXEC_OPTS,
  );
});

it('should use npm if project is not using yarn', () => {
  jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => undefined);

  PackageManager.install(PACKAGES, {
    packageManager: 'yarn',
    root: PROJECT_ROOT,
  });

  expect(execa).toHaveBeenCalledWith(
    'npm',
    ['install', '--save', '--save-exact', ...PACKAGES],
    EXEC_OPTS,
  );
});

it('should use yarn if project is using yarn', () => {
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockImplementation(() => true);

  PackageManager.install(PACKAGES, {
    packageManager: 'yarn',
    root: PROJECT_ROOT,
  });

  expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], EXEC_OPTS);
});

test.each([
  [false, 'pipe'],
  [true, 'inherit'],
])(
  'when verbose is set to %s should use "%s" stdio',
  (isVerbose: boolean, stdioType: string) => {
    jest
      .spyOn(yarn, 'getYarnVersionIfAvailable')
      .mockImplementation(() => true);
    jest.spyOn(yarn, 'isProjectUsingYarn').mockImplementation(() => true);
    jest.spyOn(logger, 'isVerbose').mockImplementation(() => isVerbose);

    PackageManager.install(PACKAGES, {
      packageManager: 'yarn',
      root: PROJECT_ROOT,
      silent: true,
    });

    expect(execa).toHaveBeenCalledWith('yarn', ['add', ...PACKAGES], {
      stdio: stdioType,
      cwd: PROJECT_ROOT,
    });
  },
);
