import execa from 'execa';
import {execaPod, findPodRunner} from '../tools/pods';

jest.mock('execa', () => jest.fn());

const mockExeca = execa as unknown as jest.Mock;
const OPTIONS = {cwd: '/project'};

function failWhen(predicate: (command: string, args: string[]) => boolean) {
  mockExeca.mockImplementation(async (command: string, args: string[]) => {
    if (predicate(command, args)) {
      throw new Error(`${command} ${args.join(' ')} failed`);
    }
    return {exitCode: 0};
  });
}

const isBundledPod = (command: string, args: string[]) =>
  command === 'bundle' && args[0] === 'exec';
const isBundleInstall = (command: string, args: string[]) =>
  command === 'bundle' && args[0] === 'install';

beforeEach(() => {
  mockExeca.mockReset();
});

describe('findPodRunner', () => {
  it('prefers the bundled CocoaPods', async () => {
    failWhen(() => false);

    await expect(findPodRunner(OPTIONS)).resolves.toBe('bundle');
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith(
      'bundle',
      ['exec', 'pod', '--version'],
      OPTIONS,
    );
  });

  it('runs bundle install with the given options when the bundled CocoaPods is missing', async () => {
    let installed = false;
    mockExeca.mockImplementation(async (command: string, args: string[]) => {
      if (isBundleInstall(command, args)) {
        installed = true;
      } else if (isBundledPod(command, args) && !installed) {
        throw new Error('not installed');
      }
      return {exitCode: 0};
    });

    await expect(findPodRunner(OPTIONS)).resolves.toBe('bundle');
    expect(mockExeca).toHaveBeenCalledWith('bundle', ['install'], OPTIONS);
  });

  it('falls back to the system CocoaPods', async () => {
    failWhen((command) => command === 'bundle');

    await expect(findPodRunner(OPTIONS)).resolves.toBe('system');
    expect(mockExeca).toHaveBeenLastCalledWith('pod', ['--version'], OPTIONS);
  });

  it('throws when CocoaPods is not installed', async () => {
    failWhen(() => true);

    await expect(findPodRunner(OPTIONS)).rejects.toThrow(
      'cocoapods not installed',
    );
  });
});

describe('execaPod', () => {
  it('runs pod through bundle exec when the bundled CocoaPods is available', async () => {
    failWhen(() => false);

    await execaPod(['install'], OPTIONS);

    expect(mockExeca).toHaveBeenLastCalledWith(
      'bundle',
      ['exec', 'pod', 'install'],
      OPTIONS,
    );
  });

  it('runs the system pod otherwise', async () => {
    failWhen((command) => command === 'bundle');

    await execaPod(['install'], OPTIONS);

    expect(mockExeca).toHaveBeenLastCalledWith('pod', ['install'], OPTIONS);
  });
});
