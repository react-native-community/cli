import http from 'http';
import open from 'open';
import {openURLMiddleware} from '../openURLMiddleware';

jest.mock('open');

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

  it('should sanitize URL with pipe character to prevent RCE', async () => {
    const maliciousUrl = 'https://example.com/|rm -rf /';
    req.body = {url: maliciousUrl};

    await openURLMiddleware(req, res, next);

    // Verify that open was called with a sanitized URL
    expect(open).toHaveBeenCalledTimes(1);
    const sanitizedUrl = (open as jest.Mock).mock.calls[0][0];

    // The sanitized URL should not contain the raw pipe character that could execute shell commands
    // The pipe character should be encoded (as %7C) to prevent shell command execution
    expect(sanitizedUrl).not.toContain('|rm -rf /');
    expect(sanitizedUrl).not.toContain('|');
    // Verify the pipe character is URL-encoded (as %7C) instead of raw
    expect(sanitizedUrl).toContain('%7C');
    expect(sanitizedUrl).toMatch(/^https:\/\/example\.com/);

    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should sanitize URL with pipe character in query string', async () => {
    const maliciousUrl = 'https://example.com/path?param=value|rm -rf /';
    req.body = {url: maliciousUrl};

    await openURLMiddleware(req, res, next);

    expect(open).toHaveBeenCalledTimes(1);
    const sanitizedUrl = (open as jest.Mock).mock.calls[0][0];

    // The pipe character in query string should be properly encoded (as %7C)
    expect(sanitizedUrl).not.toContain('|rm -rf /');
    expect(sanitizedUrl).not.toContain('|');
    expect(sanitizedUrl).toContain('%7C');
    expect(sanitizedUrl).toMatch(/^https:\/\/example\.com/);

    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should sanitize URL with pipe character in path', async () => {
    const maliciousUrl = 'https://example.com/path|rm -rf /';
    req.body = {url: maliciousUrl};

    await openURLMiddleware(req, res, next);

    expect(open).toHaveBeenCalledTimes(1);
    const sanitizedUrl = (open as jest.Mock).mock.calls[0][0];

    // The pipe character in path should be properly encoded (as %7C)
    expect(sanitizedUrl).not.toContain('|rm -rf /');
    expect(sanitizedUrl).not.toContain('|');
    expect(sanitizedUrl).toContain('%7C');
    expect(sanitizedUrl).toMatch(/^https:\/\/example\.com/);

    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should handle normal URLs without pipe characters', async () => {
    const normalUrl = 'https://example.com/path?param=value';
    req.body = {url: normalUrl};

    await openURLMiddleware(req, res, next);

    expect(open).toHaveBeenCalledTimes(1);
    const sanitizedUrl = (open as jest.Mock).mock.calls[0][0];

    expect(sanitizedUrl).toBe('https://example.com/path?param=value');

    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should return 400 for missing request body', async () => {
    req.body = undefined;

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('Missing request body');
  });

  it('should return 400 for non-string URL', async () => {
    req.body = {url: 123};

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('URL must be a string');
  });

  it('should return 400 for invalid URL format', async () => {
    req.body = {url: 'not-a-valid-url'};

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('Invalid URL format');
  });

  it('should return 400 for invalid URL protocol', async () => {
    req.body = {url: 'file:///etc/passwd'};

    await openURLMiddleware(req, res, next);

    expect(open).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('Invalid URL protocol');
  });
});
