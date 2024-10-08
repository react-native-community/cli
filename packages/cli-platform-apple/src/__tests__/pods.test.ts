import path from 'path';
import {writeFiles, getTempDirectory, cleanup} from '../../../../jest/helpers';
import installPods from '../tools/installPods';
import resolvePods, {
  compareMd5Hashes,
  getPlatformDependencies,
} from '../tools/pods';

const mockGet = jest.fn();
const mockSet = jest.fn();
jest.mock('@react-native-community/cli-tools', () => ({
  ...Object.assign(jest.requireActual('@react-native-community/cli-tools')),
  cacheManager: {
    get: mockGet,
    set: mockSet,
  },
}));
jest.mock('../tools/installPods', () => jest.fn());
const dependencyHash = 'd41d8cd98f00b204e9800998ecf8427e';

const packageJson = {
  name: 'test-package',
  dependencies: {dep1: '1.0.0'},
  devDependencies: {dep2: '1.0.0'},
};

const commonDepConfig = {
  root: '',
  platforms: {
    ios: {
      podspecPath: '',
      version: '1.0.0',
      scriptPhases: [],
      configurations: [],
    },
  },
};

const dependenciesConfig = {
  dep1: {
    name: 'dep1',
    ...commonDepConfig,
  },
  dep2: {
    name: 'dep2',
    ...commonDepConfig,
  },
};

const DIR = getTempDirectory('root_test');

const createTempFiles = (rest?: Record<string, string>) => {
  writeFiles(DIR, {
    'package.json': JSON.stringify(packageJson),
    'ios/Podfile': '',
    ...rest,
  });
};

beforeEach(async () => {
  cleanup(DIR);
  jest.resetAllMocks();
});

describe('compareMd5Hashes', () => {
  it('should return false if hashes are different', () => {
    const result = compareMd5Hashes('hash1', 'hash2');

    expect(result).toBe(false);
  });

  it('should return true if hashes are the same', () => {
    const result = compareMd5Hashes('hash', 'hash');

    expect(result).toBe(true);
  });
});

describe('getPlatformDependencies', () => {
  it('should return only dependencies with native code', () => {
    const result = getPlatformDependencies(dependenciesConfig, 'ios');
    expect(result).toEqual(['dep1@1.0.0', 'dep2@1.0.0']);
  });
});

describe('resolvePods', () => {
  it('should install pods if they are not installed', async () => {
    createTempFiles();

    await resolvePods(DIR, path.join(DIR, 'ios'), {}, 'ios');

    expect(installPods).toHaveBeenCalled();
  });

  it('should install pods when force option is set to true', async () => {
    createTempFiles();

    await resolvePods(DIR, path.join(DIR, 'ios'), {}, 'ios', {
      forceInstall: true,
    });

    expect(installPods).toHaveBeenCalled();
  });

  it('should install pods when there is no cached hash of dependencies', async () => {
    createTempFiles();

    await resolvePods(DIR, path.join(DIR, 'ios'), {}, 'ios');

    expect(mockSet).toHaveBeenCalledWith(
      packageJson.name,
      'dependencies',
      dependencyHash,
    );
  });

  it('should skip pods installation if the cached hash and current hash are the same', async () => {
    createTempFiles({
      'ios/Pods/Manifest.lock': '',
      'ios/Podfile.lock': `PODFILE CHECKSUM: ${dependencyHash}`,
    });

    mockGet.mockImplementation(() => dependencyHash);

    await resolvePods(DIR, path.join(DIR, 'ios'), {}, 'ios');

    expect(installPods).not.toHaveBeenCalled();
  });

  it('should install pods if the cached hash and current hash are different', async () => {
    createTempFiles();

    mockGet.mockImplementation(() => dependencyHash);

    await resolvePods(
      DIR,
      path.join(DIR, 'ios'),
      {
        dep1: {
          name: 'dep1',
          ...commonDepConfig,
        },
      },
      'ios',
    );

    expect(installPods).toHaveBeenCalled();
  });
});
