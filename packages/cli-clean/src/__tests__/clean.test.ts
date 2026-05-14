import {spawn} from 'child_process';
import os from 'os';
import prompts from 'prompts';
import {clean, cleanDir} from '../clean';
import {cleanup, getTempDirectory, writeFiles} from '../../../../jest/helpers';
import fs from 'fs';

const DIR = getTempDirectory('temp-cache');

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('prompts', () => jest.fn());

let mockChild: {on: jest.Mock};

beforeEach(() => {
  mockChild = {
    on: jest.fn((event: string, callback: (code: number) => void) => {
      if (event === 'close') {
        callback(0);
      }
    }),
  };
  (spawn as jest.Mock).mockImplementation(() => mockChild);
});

afterEach(() => {
  cleanup(DIR);
});

describe('clean', () => {
  const mockConfig: any = {};

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws if project root is not set', async () => {
    await expect(clean([], mockConfig, mockConfig)).rejects.toThrow();
  });

  it('prompts if `--include` is omitted', async () => {
    (prompts as jest.MockedFunction<typeof prompts>).mockReturnValue(
      Promise.resolve({
        cache: [],
      }),
    );

    await clean([], mockConfig, {include: '', projectRoot: process.cwd()});

    expect(spawn).not.toBeCalled();
    expect(prompts).toBeCalled();
  });

  it('stops Watchman and clears out caches', async () => {
    await clean([], mockConfig, {
      include: 'watchman',
      projectRoot: process.cwd(),
    });

    expect(prompts).not.toBeCalled();
    expect(spawn).toBeCalledWith(
      os.platform() === 'win32' ? 'tskill' : 'killall',
      ['watchman'],
      expect.anything(),
    );
    expect(spawn).toBeCalledWith(
      'watchman',
      ['watch-del-all'],
      expect.anything(),
    );
  });

  it('should remove paths defined with patterns', async () => {
    writeFiles(DIR, {
      'metro-cache/cache.txt': 'cache file',
      'metro-zxcvbnm/cache.txt': 'cache file',
    });

    await cleanDir(`${DIR}/metro-*`);

    expect(fs.readdirSync(DIR)).toEqual([]);
  });

  it('should remove paths defined without patterns', async () => {
    writeFiles(DIR, {
      'metro-cache/cache.txt': 'cache file',
    });

    await cleanDir(`${DIR}/metro-cache`);

    expect(fs.readdirSync(DIR)).toEqual([]);
  });
});
