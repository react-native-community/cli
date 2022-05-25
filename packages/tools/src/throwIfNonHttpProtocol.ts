/**
 * Check if a string is an http/https url
 */
export default function throwIfNonHttpProtocol(url: string) {
  const _url = new URL(url);

  const urlProtocol = _url.protocol;

  const expectedProtocol = {
    [urlProtocol]: false,
    'http:': true,
    'https:': true,
  };

  const isFromExpectedProtocol = expectedProtocol[urlProtocol];

  if (!isFromExpectedProtocol) {
    throw new Error('invalid url, missing http/https protocol');
  }
}
