import {createServer} from 'http';
import {AddressInfo} from 'net';
import {runInThisContext} from 'vm';
import isPackagerRunning from '../isPackagerRunning';
import findDevServerPort from '../findDevServerPort';
import {askForPortChange} from '../port';

jest.mock('../port', () => ({
  askForPortChange: jest.fn(),
  logAlreadyRunningBundler: jest.fn(),
  logChangePortInstructions: jest.fn(),
}));

const withServer = async (
  status: number,
  body: string,
  run: (port: number) => Promise<void>,
  headers: Record<string, string> = {},
) => {
  const server = createServer((_request, response) => {
    response.writeHead(status, headers);
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  try {
    await run((server.address() as AddressInfo).port);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
};

// Jest 26 does not expose Node's built-in fetch in its test environment.
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = runInThisContext('fetch');
});
afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  (askForPortChange as jest.Mock).mockResolvedValue({change: true});
});

test.each([400, 404, 500])(
  'recognizes a port occupied by an HTTP %i server',
  async (status) => {
    await withServer(status, 'Not Metro', async (port) => {
      expect(await isPackagerRunning(port)).toBe('unrecognized');
    });
  },
);

test.each([400, 404, 500])(
  'offers another port when the current server responds with HTTP %i',
  async (status) => {
    await withServer(status, 'Not Metro', async (port) => {
      const result = await findDevServerPort(port, '/test/project');
      expect(askForPortChange).toHaveBeenCalledWith(port, result.port);
      expect(result.port).toBeGreaterThan(port);
      expect(result.startPackager).toBe(true);
    });
  },
);

test('recognizes a successful response from another server', async () => {
  await withServer(200, 'Not Metro', async (port) => {
    expect(await isPackagerRunning(port)).toBe('unrecognized');
  });
});

test('recognizes Metro and its project root', async () => {
  await withServer(
    200,
    'packager-status:running',
    async (port) => {
      expect(await isPackagerRunning(port)).toEqual({
        status: 'running',
        root: '/test/project',
      });
    },
    {'X-React-Native-Project-Root': '/test/project'},
  );
});

test('does not start another Metro instance for the same project', async () => {
  await withServer(
    200,
    'packager-status:running',
    async (port) => {
      expect(await findDevServerPort(port, '/test/project')).toEqual({
        port,
        startPackager: false,
      });
      expect(askForPortChange).not.toHaveBeenCalled();
    },
    {'X-React-Native-Project-Root': '/test/project'},
  );
});

test('returns not_running when no server is listening', async () => {
  let port = 0;
  await withServer(200, '', async (listeningPort) => {
    port = listeningPort;
  });
  expect(await isPackagerRunning(port)).toBe('not_running');
  expect(await findDevServerPort(port, '/test/project')).toEqual({
    port,
    startPackager: true,
  });
  expect(askForPortChange).not.toHaveBeenCalled();
});
