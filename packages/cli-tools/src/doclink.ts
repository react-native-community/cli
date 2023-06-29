import os from 'os';
import assert from 'assert';

type Platforms =
  | 'android'
  | 'ios'
  | 'inherit' // Expect the platform to be defined before this link is called with the link.setPlatform()
  | 'none'; // No platform specific documentation

export function getOS(): string {
  // Using os.platform instead of process.platform so we can test more easily. Once jest upgrades
  // to ^29.4 we could use process.platforms and jest.replaceProperty(process, 'platforms', 'someplatform');
  switch (os.platform()) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'sunos':
      // King of controversy, right here.
      return 'linux';
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    default:
      return '';
  }
}

let _platform: Platforms | null = null;
let _version: string | undefined;

interface Overrides {
  os?: string;
  hash?: string;
  version?: string;
}

interface Other {
  [key: string]: string;
}

/**
 * Create a deeplink to our documentation based on the user's OS and the Platform they're trying to build.
 */
function doclink(
  section: string,
  path: string,
  platform: Platforms,
  hashOrOverrides?: string | (Overrides & Other),
): string {
  const url = new URL('https://reactnative.dev/');

  // Overrides
  const isObj = typeof hashOrOverrides === 'object';

  const hash = isObj ? hashOrOverrides.hash : hashOrOverrides;
  const version =
    isObj && hashOrOverrides.version ? hashOrOverrides.version : _version;
  const OS = isObj && hashOrOverrides.os ? hashOrOverrides.os : getOS();

  url.pathname = _version
    ? `${section}/${version}/${path}`
    : `${section}/${path}`;

  url.searchParams.set('os', OS);

  if (platform === 'inherit') {
    assert.ok(
      _platform !== null,
      `Please report this CLI error:  link.setPlatform('ios'|'android'|'none') was expected to be set before using link.${section}(${path}, 'inherit').`,
    );
  }

  const plat: Platforms =
    platform === 'inherit' ? (_platform as Platforms) : platform ?? _platform;

  if (plat !== 'none') {
    url.searchParams.set('platform', plat);
  }

  if (isObj) {
    const otherKeys = Object.keys(hashOrOverrides).filter(
      (key) => !['hash', 'version', 'os'].includes(key),
    );
    for (let key of otherKeys) {
      url.searchParams.set(key, hashOrOverrides[key]);
    }
  }

  if (hash) {
    assert.doesNotMatch(
      hash,
      /#/,
      "Anchor links should be written without a '#'",
    );
    url.hash = hash;
  }

  return url.toString();
}

export const docs = doclink.bind(null, 'docs');
export const contributing = doclink.bind(null, 'contributing');
export const community = doclink.bind(null, 'community');
export const showcase = doclink.bind(null, 'showcase');
export const blog = doclink.bind(null, 'blog');

/**
 * When the user builds, we should define the target platform globally.
 */
export function setPlatform(target: Platforms): void {
  _platform = target;
}

/**
 * Can we figure out what version of react native they're using?
 */
export function setVersion(reactNativeVersion: string): void {
  _version = reactNativeVersion;
}
