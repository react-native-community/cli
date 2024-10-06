/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync} from 'child_process';
import findUp from 'find-up';
import semver from 'semver';

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

export const getNpmRegistryUrl = (() => {
  // Lazily resolve npm registry url since it is only needed when initializing a
  // new project.
  let registryUrl = '';
  return () => {
    if (!registryUrl) {
      try {
        registryUrl = execSync(
          'npm config get registry --workspaces=false --include-workspace-root',
        )
          .toString()
          .trim();
      } catch {
        registryUrl = 'https://registry.npmjs.org/';
      }
    }
    return registryUrl;
  };
})();

/**
 * Convert an npm tag to a concrete version, for example:
 * - next -> 0.75.0-rc.0
 * - nightly -> 0.75.0-nightly-20240618-5df5ed1a8
 */
export async function npmResolveConcreteVersion(
  packageName: string,
  tagOrVersion: string,
): Promise<string> {
  const url = new URL(getNpmRegistryUrl());
  url.pathname = `${packageName}/${tagOrVersion}`;
  const resp = await fetch(url);
  if (
    [
      200, // OK
      301, // Moved Permanemently
      302, // Found
      304, // Not Modified
      307, // Temporary Redirect
      308, // Permanent Redirect
    ].indexOf(resp.status) === -1
  ) {
    throw new Error(`Unknown version ${packageName}@${tagOrVersion}`);
  }
  const json: any = await resp.json();
  return json.version;
}

type TimeStampString = string;
type TemplateVersion = string;
type VersionedTemplates = {
  [rnVersion: string]: Template[];
};

type NpmTemplateResponse = {
  versions: {
    // Template version, semver including -rc candidates
    [version: TemplateVersion]: {
      scripts?: {
        // Version of react-native this is built for
        reactNativeVersion?: string;
        // The initial implemntation used this, but moved to reactNativeVersion
        version?: string;
      };
    };
  };
  time: {
    created: string;
    modified: string;
    [version: TemplateVersion]: TimeStampString;
  };
};

class Template {
  version: string;
  reactNativeVersion: string;
  published: Date;

  constructor(version: string, reactNativeVersion: string, published: string) {
    this.version = version;
    this.reactNativeVersion = reactNativeVersion;
    this.published = new Date(published);
  }

  get isPreRelease() {
    return this.version.includes('-rc');
  }
}

const minorVersion = (version: string) => {
  const v = semver.parse(version)!;
  return `${v.major}.${v.minor}`;
};

export async function getTemplateVersion(
  reactNativeVersion: string,
): Promise<TemplateVersion | undefined> {
  const json = await fetch(getNpmRegistryUrl() + '@react-native-community/template').then(
    (resp) => resp.json() as Promise<NpmTemplateResponse>,
  );

  // We are abusing which npm metadata is publicly available through the registry. Scripts
  // is always captured, and we use this in the Github Action that manages our releases to
  // capture the version of React Native the template is built with.
  //
  // Users are interested in:
  // - IF there a match for React Native MAJOR.MINOR.PATCH?
  //    - Yes: if there are >= 2 versions, pick the one last published. This lets us release
  //           specific fixes for React Native versions.
  // - ELSE, is there a match for React Native MINOR.PATCH?
  //    - Yes: if there are >= 2 versions, pick the one last published. This decouples us from
  //           React Native releases.
  //    - No: we don't have a version of the template for a version of React Native. There should
  //          at a minimum be at last one version cut for each MINOR.PATCH since 0.75. Before this
  //          the template was shipped with React Native
  const rnToTemplate: VersionedTemplates = {};
  for (const [templateVersion, pkg] of Object.entries(json.versions)) {
    const rnVersion = pkg?.scripts?.reactNativeVersion ?? pkg?.scripts?.version;
    if (rnVersion == null || !semver.valid(rnVersion)) {
      // This is a very early version that doesn't have the correct metadata embedded
      continue;
    }

    const template = new Template(
      templateVersion,
      rnVersion,
      json.time[templateVersion],
    );

    const rnMinorVersion = minorVersion(rnVersion);

    rnToTemplate[rnVersion] = rnToTemplate[rnVersion] ?? [];
    rnToTemplate[rnVersion].push(template);
    rnToTemplate[rnMinorVersion] = rnToTemplate[rnMinorVersion] ?? [];
    rnToTemplate[rnMinorVersion].push(template);
  }

  // Make sure the last published is the first one in each version of React Native
  for (const v in rnToTemplate) {
    rnToTemplate[v].sort(
      (a, b) => b.published.getTime() - a.published.getTime(),
    );
  }

  if (reactNativeVersion in rnToTemplate) {
    return rnToTemplate[reactNativeVersion][0].version;
  }
  const rnMinorVersion = minorVersion(reactNativeVersion);
  if (rnMinorVersion in rnToTemplate) {
    return rnToTemplate[rnMinorVersion][0].version;
  }
  return;
}
