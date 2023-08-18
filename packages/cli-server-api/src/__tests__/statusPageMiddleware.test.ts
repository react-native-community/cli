import http from 'http';
import statusPageMiddleware from './../statusPageMiddleware';

describe('statusPageMiddleware', () => {
  it('should set headers and end the response', () => {
    process.cwd = () => '/mocked/path';

    const res: http.ServerResponse = {
      setHeader: jest.fn(),
      end: jest.fn(),
    } as any;

    const mockReq: http.IncomingMessage = {} as any;
    statusPageMiddleware(mockReq, res);

    // We're strictly checking response here, because React Native is strongly depending on this response. Changing the response might be a breaking change.
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-React-Native-Project-Root',
      '/mocked/path',
    );
    expect(res.end).toHaveBeenCalledWith('packager-status:running');
  });
});
