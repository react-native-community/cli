import findDevServerPort from '../findDevServerPort';
import isPackagerRunning from '../isPackagerRunning';
import handlePortUnavailable from '../handlePortUnavailable';

jest.mock('../isPackagerRunning');
jest.mock('../handlePortUnavailable');
jest.mock('../port', () => ({
  logAlreadyRunningBundler: jest.fn(),
  askForPortChange: jest.fn(),
  logChangePortInstructions: jest.fn(),
}));

const isPackagerRunningMock = isPackagerRunning as jest.MockedFunction<
  typeof isPackagerRunning
>;
const handlePortUnavailableMock = handlePortUnavailable as jest.MockedFunction<
  typeof handlePortUnavailable
>;

beforeEach(() => {
  jest.clearAllMocks();
  handlePortUnavailableMock.mockResolvedValue({port: 8082, packager: true});
});

test('reuses the running dev server when the project root has a space', async () => {
  const root = '/Users/me/my app';

  isPackagerRunningMock.mockResolvedValue({
    status: 'running',
    root: '/Users/me/my%20app',
  });

  await expect(findDevServerPort(8081, root)).resolves.toEqual({
    port: 8081,
    startPackager: false,
  });
  expect(handlePortUnavailableMock).not.toHaveBeenCalled();
});

test('reuses the running dev server for a plain ASCII project root', async () => {
  const root = '/Users/me/project';

  isPackagerRunningMock.mockResolvedValue({
    status: 'running',
    root: '/Users/me/project',
  });

  await expect(findDevServerPort(8081, root)).resolves.toEqual({
    port: 8081,
    startPackager: false,
  });
  expect(handlePortUnavailableMock).not.toHaveBeenCalled();
});

test('asks for another port when a different project owns the port', async () => {
  isPackagerRunningMock.mockResolvedValue({
    status: 'running',
    root: '/Users/me/other',
  });

  await expect(findDevServerPort(8081, '/Users/me/project')).resolves.toEqual({
    port: 8082,
    startPackager: true,
  });
  expect(handlePortUnavailableMock).toHaveBeenCalledWith(
    8081,
    '/Users/me/project',
  );
});
