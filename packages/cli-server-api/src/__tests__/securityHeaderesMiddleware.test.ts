import securityHeadersMiddleware from '../securityHeadersMiddleware';

describe('securityHeadersMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      setHeader: () => {},
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should block requests from different origins', () => {
    req.headers.origin = 'https://example.com';
    const middleware = securityHeadersMiddleware({});
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should allow requests from localhost', () => {
    req.headers.origin = 'http://localhost:3000';
    const middleware = securityHeadersMiddleware({});
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow requests from devtools', () => {
    req.headers.origin = 'devtools://devtools';
    const middleware = securityHeadersMiddleware({});
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow requests from custom host if provided in options', () => {
    req.headers.origin = 'http://customhost.com';
    const middleware = securityHeadersMiddleware({host: 'customhost.com'});
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should block requests from custom host if provided in options but not matching', () => {
    req.headers.origin = 'http://anotherhost.com';
    const middleware = securityHeadersMiddleware({host: 'customhost.com'});
    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
