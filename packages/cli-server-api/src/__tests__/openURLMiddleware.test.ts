import http from 'http';
import open from 'open';
import {openURLMiddleware} from '../openURLMiddleware';

jest.mock('open');
jest.mock('strict-url-sanitise', () => ({
  sanitizeUrl: jest.fn((url: string) => {
    // Simulate the behavior of strict-url-sanitise
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid url to pass to open(): ${url}`);
    }
    if (parsed.hostname !== encodeURIComponent(parsed.hostname)) {
      throw new Error(`Invalid url to pass to open(): ${url}`);
    }
    return url;
  }),
}));

describe('openURLMiddleware', () => {
  let req: http.IncomingMessage & {body?: Object};
  let res: jest.Mocked<http.ServerResponse>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {},
    } as any;

    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as any;

    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 for non-string URL', async () => {
    req.body = {url: 123};

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('URL must be a string');
  });

  it('should reject malicious URL with invalid hostname', async () => {
    const maliciousUrl = 'https://www.$(calc.exe).com/foo';
    req.body = {url: maliciousUrl};

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith(
      expect.stringContaining('Invalid url to pass to open()'),
    );
  });
});
