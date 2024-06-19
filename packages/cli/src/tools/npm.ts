/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import findUp from 'find-up';

export function getNpmVersionIfAvailable() {
  let npmVersion;
  try {
    // execSync returns a Buffer -> convert to string
    npmVersion = (
      execSync('npm --version', {
        stdio: [0, 'pipe', 'ignore'],
      }).toString() || ''
    ).trim();

    return npmVersion;
  } catch (error) {
    return null;
  }
}

export function isProjectUsingNpm(cwd: string) {
  return findUp.sync('package-lock.json', {cwd});
}

const registry = getNpmRegistryUrl();

/**
 * Convert an npm tag to a concrete version, for example:
 * - next -> 0.75.0-rc.0
 * - nightly -> 0.75.0-nightly-20240618-5df5ed1a8
 */
export async function npmResolveConcreteVersion(
  packageName: string,
  tagOrVersion: string,
): Promise<string> {
  const url = new URL(registry);
  url.pathname = `${packageName}/${tagOrVersion}`;
  const json: any = await fetch(url).then((resp) => resp.json());
  return json.version;
}

export async function npmCheckPackageVersionExists(
  packageName: string,
  tagOrVersion: string,
): Promise<boolean> {
  const url = new URL(registry);
  url.pathname = `${packageName}/${tagOrVersion}`;
  return await urlExists(url);
}

async function urlExists(url: string | URL): Promise<boolean> {
  try {
    // @ts-ignore-line: TS2304
    const {status} = await fetch(url, {method: 'HEAD'});
    return (
      [
        200, // OK
        301, // Moved Permanemently
        302, // Found
        304, // Not Modified
        307, // Temporary Redirect
        308, // Permanent Redirect
      ].indexOf(status) !== -1
    );
  } catch {
    return false;
  }
}

export function getNpmRegistryUrl(): string {
  try {
    return execSync('npm config get registry').toString().trim();
  } catch {
    return 'https://registry.npmjs.org/';
  }
}
