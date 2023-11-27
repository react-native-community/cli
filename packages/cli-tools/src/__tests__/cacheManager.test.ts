import fs from 'fs';
import path from 'path';
import cacheManager from '../cacheManager';
import {cleanup, getTempDirectory} from '../../../../jest/helpers';

const DIR = getTempDirectory('.react-native-cli/cache');
const projectName = 'Project1';
const fullPath = path.join(DIR, projectName);

describe('cacheManager', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    cleanup(DIR);
  });

  test('should not remove cache if it does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'rmSync').mockImplementation(() => {});

    cacheManager.removeProjectCache(projectName);

    expect(fs.rmSync).not.toHaveBeenCalled();
  });

  test('should remove cache if it exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'rmSync').mockImplementation(() => {});
    jest.spyOn(path, 'resolve').mockReturnValue(fullPath);

    cacheManager.removeProjectCache(projectName);

    expect(fs.rmSync).toHaveBeenCalledWith(fullPath, {recursive: true});
  });
});
