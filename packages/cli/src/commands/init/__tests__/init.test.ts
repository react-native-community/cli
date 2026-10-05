import initialize from '../init';
import * as npm from '../../../tools/npm';
import * as yarn from '../../../tools/yarn';

afterEach(() => {
  jest.restoreAllMocks();
});

test('rejects when the requested package manager is unavailable', async () => {
  jest.spyOn(npm, 'npmResolveConcreteVersion').mockResolvedValue('0.76.0');
  jest.spyOn(yarn, 'getYarnVersionIfAvailable').mockReturnValue(null);

  await expect(initialize(['TestApp'], {pm: 'yarn'})).rejects.toThrowError(
    'Seems like the package manager you want to use is not installed.',
  );
});
