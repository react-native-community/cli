/**
 * Normalizes a project root to the form used by the dev server's
 * `X-React-Native-Project-Root` header.
 *
 * A header value has to be a valid ISO-8859-1 string, so the dev server
 * percent-encodes the path before sending it. Anything comparing a local
 * project root against that header has to apply the same transformation,
 * otherwise roots containing characters that get encoded (a space, an accent,
 * a non-latin script) never match.
 */
export default function normalizeProjectRoot(root: string): string {
  return new URL(`file:///${root}`).pathname.slice(1);
}
