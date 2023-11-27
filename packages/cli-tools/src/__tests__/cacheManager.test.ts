import fs from 'fs';
import path from 'path';
import cacheManager from '../cacheManager';

const projectName = 'Project1';
const cachePath = '.react-native-cli/cache';
const fullPath = path.join(cachePath, projectName);

describe('cacheManager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should remove cache if it exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'rmSync').mockImplementation(() => {});
    jest
      .spyOn(path, 'resolve')
      .mockReturnValue(path.join(cachePath, projectName));

    cacheManager.removeProjectCache(projectName);

    expect(fs.rmSync).toHaveBeenCalledWith(fullPath, {recursive: true});
  });

  test('should not remove cache if it does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'rmSync').mockImplementation(() => {});

    cacheManager.removeProjectCache(projectName);

    expect(fs.rmSync).not.toHaveBeenCalled();
  });
});
