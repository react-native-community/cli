/**
 * Check if a url uses an allowed protocol
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'flipper:'];

export default function throwIfNonAllowedProtocol(url: string) {
  const _url = new URL(url);
  const urlProtocol = _url.protocol;

  if (!ALLOWED_PROTOCOLS.includes(urlProtocol)) {
    throw new Error(
      `Invalid url protocol ${urlProtocol}.\nAllowed protocols: ${ALLOWED_PROTOCOLS.join(
        ', ',
      )}`,
    );
  }
}
