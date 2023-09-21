import {writeFiles, getTempDirectory, cleanup} from '../../../../jest/helpers';
import installPods from '../tools/installPods';
import resolvePods, {
  compareMd5Hashes,
  normalizeDependencies,
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
const dependencyHash = 'abecd1ad748898def530ff27362e14ba';

const packageJson = {
  name: 'test-package',
  dependencies: {dep1: '1.0.0'},
  devDependencies: {dep2: '2.0.0'},
};

const DIR = getTempDirectory('root_test');

const createTempFiles = (rest?: Record<string, string>) => {
  writeFiles(DIR, {
    'package.json': JSON.stringify(packageJson),
    ...rest,
  });
};

beforeEach(async () => {
  await cleanup(DIR);
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

describe('normalizeDependencies', () => {
  it('should normalize dependencies', () => {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const result = normalizeDependencies(dependencies);
    expect(result).toEqual(['dep1@1.0.0', 'dep2@2.0.0']);
  });
});

describe('resolvePods', () => {
  it('should install pods if they are not installed', async () => {
    createTempFiles({'ios/Podfile/Manifest.lock': ''});

    await resolvePods(DIR);

    expect(installPods).toHaveBeenCalled();
  });

  it('should install pods when force option is set to true', async () => {
    createTempFiles();

    await resolvePods(DIR, {forceInstall: true});

    expect(installPods).toHaveBeenCalled();
  });

  it('should install pods when there is no cached hash of dependencies', async () => {
    createTempFiles();

    await resolvePods(DIR);

    expect(mockSet).toHaveBeenCalledWith(
      packageJson.name,
      'dependencies',
      dependencyHash,
    );
  });

  it('should skip pods installation if the cached hash and current hash are the same', async () => {
    createTempFiles({'ios/Pods/Manifest.lock': ''});

    mockGet.mockImplementation(() => dependencyHash);

    await resolvePods(DIR);

    expect(installPods).not.toHaveBeenCalled();
  });
});
