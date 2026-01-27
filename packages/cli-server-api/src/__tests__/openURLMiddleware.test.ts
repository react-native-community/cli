import http from 'http';
import {Readable} from 'stream';
import open from 'open';
import openURLMiddleware from '../openURLMiddleware';

jest.mock('open');

function createMockRequest(method: string, body: object): http.IncomingMessage {
  const bodyStr = JSON.stringify(body);
  const readable = new Readable();
  readable.push(bodyStr);
  readable.push(null);

  return Object.assign(readable, {
    method,
    url: '/',
    headers: {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(bodyStr)),
    },
  }) as unknown as http.IncomingMessage;
}

describe('openURLMiddleware', () => {
  let res: jest.Mocked<http.ServerResponse>;
  let next: jest.Mock;

  beforeEach(() => {
    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
      setHeader: jest.fn(),
    } as any;

    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return 400 for non-string URL', (done) => {
    const req = createMockRequest('POST', {url: 123});

    res.end = jest.fn(() => {
      expect(open).not.toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400);
      expect(res.end).toHaveBeenCalledWith('URL must be a string');
      done();
    }) as any;

    openURLMiddleware(req, res, next);
  });

  test('should reject malicious URL with invalid hostname', (done) => {
    const maliciousUrl = 'https://www.$(calc.exe).com/foo';
    const req = createMockRequest('POST', {url: maliciousUrl});

    res.end = jest.fn(() => {
      expect(open).not.toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400);
      expect(res.end).toHaveBeenCalledWith('Invalid URL');
      done();
    }) as any;

    openURLMiddleware(req, res, next);
  });

  // CVE-2025-11953
  test('should reject URL with Windows pipe separator', (done) => {
    const maliciousUrl = 'https://evil.com?|calc.exe';
    const req = createMockRequest('POST', {url: maliciousUrl});

    res.end = jest.fn(() => {
      expect(open).not.toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400);
      expect(res.end).toHaveBeenCalledWith('Invalid URL');
      done();
    }) as any;

    openURLMiddleware(req, res, next);
  });

  // CVE-2025-11953
  test('should reject URL with Windows command exfiltration', (done) => {
    // Encodes to reveal %BETA% env var
    const maliciousUrl = 'https://example.com/?a=%¾TA%';
    const req = createMockRequest('POST', {url: maliciousUrl});

    res.end = jest.fn(() => {
      expect(open).not.toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400);
      expect(res.end).toHaveBeenCalledWith('Invalid URL');
      done();
    }) as any;

    openURLMiddleware(req, res, next);
  });
});
