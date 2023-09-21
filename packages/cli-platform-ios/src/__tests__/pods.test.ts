import {compareMd5Hashes, normalizeDependencies} from '../tools/pods';

const packageJson = {
  name: 'test-package',
  dependencies: {dep1: '1.0.0'},
  devDependencies: {dep2: '2.0.0'},
};

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
