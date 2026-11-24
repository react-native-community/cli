import {execFileSync, execSync} from 'child_process';
import execa from 'execa';
import tryLaunchEmulator from '../tryLaunchEmulator';

jest.mock('child_process');
jest.mock('execa');

const flushPromises = () => Promise.resolve().then(() => Promise.resolve());

describe('tryLaunchEmulator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    (execa.sync as jest.Mock).mockReturnValue({stdout: 'Pixel_9'});
    (execa as unknown as jest.Mock).mockReturnValue({
      on: jest.fn(),
      unref: jest.fn(),
    });
    (execSync as jest.Mock).mockReturnValue(
      Buffer.from('List of devices attached\nemulator-5554\tdevice\n'),
    );
    (execFileSync as jest.Mock).mockReturnValue(Buffer.from(''));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('waits for Android framework boot completion after adb connects', async () => {
    const resultPromise = tryLaunchEmulator('/path/to/adb');
    const onResult = jest.fn();
    resultPromise.then(onResult);

    jest.advanceTimersByTime(1000);
    await flushPromises();

    expect(onResult).not.toHaveBeenCalled();
    expect(execFileSync).toHaveBeenCalledWith('/path/to/adb', [
      '-s',
      'emulator-5554',
      'shell',
      'getprop',
      'sys.boot_completed',
    ]);

    (execFileSync as jest.Mock).mockReturnValue(Buffer.from('1\n'));
    jest.advanceTimersByTime(1000);

    await expect(resultPromise).resolves.toEqual({success: true});
  });

  test('allows up to two minutes for a cold boot to complete', async () => {
    const resultPromise = tryLaunchEmulator('/path/to/adb');
    const onResult = jest.fn();
    resultPromise.then(onResult);

    jest.advanceTimersByTime(119_000);
    await flushPromises();
    expect(onResult).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await expect(resultPromise).resolves.toEqual({
      success: false,
      error: expect.stringContaining('It took too long'),
    });
  });
});
