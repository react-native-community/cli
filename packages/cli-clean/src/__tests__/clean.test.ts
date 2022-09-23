import execa from 'execa';
import os from 'os';
import prompts from 'prompts';
import {clean} from '../clean';

jest.mock('execa', () => jest.fn());
jest.mock('prompts', () => jest.fn());

describe('clean', () => {
  const mockConfig: any = {};

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws if project root is not set', () => {
    expect(clean([], mockConfig, mockConfig)).rejects.toThrow();
  });

  it('prompts if `--include` is omitted', async () => {
    prompts.mockReturnValue({cache: []});

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
});
