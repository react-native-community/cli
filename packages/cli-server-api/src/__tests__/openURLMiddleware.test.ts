import http from 'http';
import {Readable} from 'stream';
import open from 'open';
import openURLMiddleware from '../openURLMiddleware';

jest.mock('open');

function createMockRequest(
  method: string,
  body?: object,
): http.IncomingMessage {
  const bodyStr = body == null ? '' : JSON.stringify(body);
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

type MiddlewareResponse = {
  body?: string;
  next: jest.Mock;
  statusCode?: number;
};

function callOpenURLMiddleware(
  body?: object,
  method = 'POST',
): Promise<MiddlewareResponse> {
  return new Promise((resolve, reject) => {
    const response: MiddlewareResponse = {
      next: jest.fn((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }),
    };

    const res = {
      writeHead: jest.fn((statusCode: number) => {
        response.statusCode = statusCode;
      }),
      end: jest.fn((message?: string) => {
        response.body = message;
        resolve(response);
      }),
      setHeader: jest.fn(),
    } as any;

    openURLMiddleware(createMockRequest(method, body), res, response.next);
  });
}

describe('openURLMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    'https://reactnative.dev/docs/tutorial',
    'https://reactnative.dev/docs/fast-refresh',
    'https://x.com/reactnative',
  ])('should open React Native welcome screen URL %s', async (url) => {
    const response = await callOpenURLMiddleware({url});

    expect(open).toHaveBeenCalledWith(url);
    expect(response.statusCode).toBe(200);
    expect(response.next).not.toHaveBeenCalled();
  });

  test('should return 400 for non-string URL', async () => {
    const response = await callOpenURLMiddleware({url: 123});

    expect(open).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe('URL must be a string');
  });

  // CVE-2025-11953
  test.each([
    ['JFrog bare executable command', 'calc.exe'],
    ['JFrog nested cmd RCE command', 'cmd /c echo abc > c:\\temp\\pwned.txt'],
    ['Windows command prefix', '& calc.exe'],
    [
      'URL followed by Windows command separator',
      'https://example.com & calc.exe',
    ],
    ['malicious URL with invalid hostname', 'https://www.$(calc.exe).com/foo'],
    ['URL with Windows pipe separator', 'https://evil.com?|calc.exe'],
    ['URL with Windows caret separator', 'https://example.com/?x=^calc'],
    ['URL with Windows command exfiltration', 'https://example.com/?a=%¾TA%'],
    ['URL with Windows delayed expansion', 'https://example.com/?x=!PATH!'],
    [
      'URL with Windows redirect metacharacter',
      'https://example.com/?x=>out.txt',
    ],
    [
      'URL with Windows metacharacter in userinfo',
      'https://u:p|ss@example.com/',
    ],
    ['file URL scheme', 'file:///etc/passwd'],
    ['javascript URL scheme', 'javascript:alert(1)'],
    ['custom URL scheme', 'ms-msdt:/id'],
    ['IPv6 hostname with injected metacharacter', 'https://[::1|x]/'],
  ])('should reject %s', async (_name, url) => {
    const response = await callOpenURLMiddleware({url});

    expect(open).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe('Invalid URL');
  });
});
