import execa from 'execa';
import os from 'os';
import prompts from 'prompts';
import {clean, cleanDir} from '../clean';
import {cleanup, getTempDirectory, writeFiles} from '../../../../jest/helpers';
import fs from 'fs';
import path from 'path';

const DIR = getTempDirectory('temp-cache');

jest.mock('execa', () => jest.fn());
jest.mock('prompts', () => jest.fn());

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

    expect(execa).not.toBeCalled();
    expect(prompts).toBeCalled();
  });

  it('stops Watchman and clears out caches', async () => {
    await clean([], mockConfig, {
      include: 'watchman',
      projectRoot: process.cwd(),
    });

    expect(prompts).not.toBeCalled();
    expect(execa).toBeCalledWith(
      os.platform() === 'win32' ? 'tskill' : 'killall',
      ['watchman'],
      expect.anything(),
    );
    expect(execa).toBeCalledWith(
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

  describe('CocoaPods paths', () => {
    const projectRoot = path.join(DIR, 'project');
    const homeDirectory = path.join(DIR, 'home');
    let originalCwd: string;

    beforeEach(() => {
      originalCwd = process.cwd();
      writeFiles(DIR, {
        'project/package.json': '{}',
        'home/.cocoapods/repos/spec.json': '{}',
        'working/ios/Pods/keep.txt': 'unrelated project',
        'working/~/.cocoapods/keep.txt': 'literal tilde directory',
      });
      process.chdir(path.join(DIR, 'working'));
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'homedir').mockReturnValue(homeDirectory);
    });

    afterEach(() => {
      process.chdir(originalCwd);
      jest.restoreAllMocks();
    });

    it('removes the spec cache from the home directory', async () => {
      await clean([], {project: {}} as any, {
        include: 'cocoapods',
        projectRoot,
      });

      expect(fs.existsSync(path.join(homeDirectory, '.cocoapods'))).toBe(false);
      expect(fs.existsSync('~/.cocoapods/keep.txt')).toBe(true);
    });

    it.each([undefined, 'native/ios'])(
      'removes installed pods from the project with sourceDir %s',
      async (sourceDir) => {
        const iosDirectory = path.join(projectRoot, sourceDir ?? 'ios');
        writeFiles(iosDirectory, {'Pods/cache.txt': 'installed pod'});

        await clean(
          [],
          {
            project: {
              ios: sourceDir ? {sourceDir: iosDirectory} : null,
            },
          } as any,
          {include: 'cocoapods', projectRoot},
        );

        expect(fs.existsSync(path.join(iosDirectory, 'Pods'))).toBe(false);
        expect(fs.existsSync('ios/Pods/keep.txt')).toBe(true);
        expect(execa).toBeCalledWith('pod', ['cache', 'clean', '--all'], {
          cwd: projectRoot,
        });
      },
    );
  });
});
