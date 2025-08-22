import http from 'http';
import statusPageMiddleware from './../statusPageMiddleware';

describe('statusPageMiddleware', () => {
  let res: jest.Mocked<http.ServerResponse>;
  let mockReq: http.IncomingMessage;

  beforeEach(() => {
    res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    } as any;

    mockReq = {} as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set headers and end the response', () => {
    jest.spyOn(process, 'cwd').mockReturnValue('/mocked/path');

    statusPageMiddleware(mockReq, res);

    // We're strictly checking response here, because React Native is strongly depending on this response. Changing the response might be a breaking change.
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-React-Native-Project-Root',
      '/mocked/path',
    );
    expect(res.end).toHaveBeenCalledWith('packager-status:running');
  });

  it('should set headers and end the response with decoded value', () => {
    jest.spyOn(process, 'cwd').mockReturnValue('/привіт/path');

    statusPageMiddleware(mockReq, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-React-Native-Project-Root',
      '/%D0%BF%D1%80%D0%B8%D0%B2%D1%96%D1%82/path',
    );
    expect(res.end).toHaveBeenCalledWith('packager-status:running');
  });
});
