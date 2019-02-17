// @flow
import path from 'path';
import fs from 'fs';
import semver from 'semver';
import execa from 'execa';
import type { ContextT } from '../core/types.flow';
import logger from '../util/logger';
import PackageManager from '../util/PackageManager';
import { fetch } from './helpers';

const getLatestRNVersion = async (): Promise<string> => {
  logger.info('No version passed. Fetching latest...');
  const { stdout } = await execa('npm', ['info', 'react-native', 'version']);
  return stdout;
};

const getRNPeerDeps = async (
  version: string
): Promise<{ [key: string]: string }> => {
  const { stdout } = await execa('npm', [
    'info',
    `react-native@${version}`,
    'peerDependencies',
    '--json',
  ]);

  return JSON.parse(stdout);
};

const getPatch = async (currentVersion, newVersion, projectDir) => {
  let patch;
  const rnDiffPurgeUrl = 'https://github.com/pvinis/rn-diff-purge';
  const rnDiffAppName = 'RnDiffApp';
  const { name } = require(path.join(projectDir, 'package.json'));

  logger.info(`Fetching diff between v${currentVersion} and v${newVersion}...`);

  try {
    patch = await fetch(
      `${rnDiffPurgeUrl}/compare/version/${currentVersion}...version/${newVersion}.diff`
    );
  } catch (error) {
    logger.error(
      `Failed to fetch diff for react-native@${newVersion}. Maybe it's not released yet?`
    );
    logger.info(
      `For available releases to diff see: https://github.com/pvinis/rn-diff-purge#version-changes`
    );
    return null;
  }

  return patch
    .replace(new RegExp(rnDiffAppName, 'g'), name)
    .replace(new RegExp(rnDiffAppName.toLowerCase(), 'g'), name.toLowerCase());
};

const getVersionToUpgradeTo = async (argv, currentVersion, projectDir) => {
  const newVersion = argv[0]
    ? semver.valid(argv[0]) ||
      (semver.coerce(argv[0]) ? semver.coerce(argv[0]).version : null)
    : await getLatestRNVersion();

  if (!newVersion) {
    logger.error(
      `Provided version "${
        argv[0]
      }" is not allowed. Please pass a valid semver version`
    );
    return null;
  }

  if (currentVersion > newVersion) {
    logger.error(
      `Trying to upgrade from newer version "${currentVersion}" to older "${newVersion}"`
    );
    return null;
  }
  if (currentVersion === newVersion) {
    const {
      dependencies: { 'react-native': version },
    } = require(path.join(projectDir, 'package.json'));

    if (semver.satisfies(newVersion, version)) {
      logger.warn(
        `Specified version "${newVersion}" is already installed in node_modules and it satisfies "${version}" semver range. No need to upgrade`
      );
      return null;
    }
    logger.error(
      `Dependency mismatch. Specified version "${newVersion}" is already installed in node_modules and it doesn't satisfy "${version}" semver range of your "react-native" dependency. Please re-install your dependencies`
    );
    return null;
  }

  return newVersion;
};

const installDeps = async (newVersion, projectDir) => {
  logger.info(
    `Installing react-native@${newVersion} and its peer dependencies...`
  );
  const peerDeps = await getRNPeerDeps(newVersion);
  const pm = new PackageManager({ projectDir });
  const deps = [
    `react-native@${newVersion}`,
    ...Object.keys(peerDeps).map(module => `${module}@${peerDeps[module]}`),
  ];
  pm.install(deps);
};

/**
 * Upgrade application to a new version of React Native.
 */
async function upgrade(argv: Array<string>, ctx: ContextT) {
  const rnDiffGitAddress = `https://github.com/pvinis/rn-diff-purge.git`;
  const tmpRemote = 'tmp-rn-diff-purge';
  const tmpPatchFile = 'tmp-upgrade-rn.patch';
  const projectDir = ctx.root;
  const { version: currentVersion } = require(path.join(
    projectDir,
    'node_modules/react-native/package.json'
  ));

  const newVersion = await getVersionToUpgradeTo(
    argv,
    currentVersion,
    projectDir
  );

  if (!newVersion) {
    return;
  }

  const patch = await getPatch(currentVersion, newVersion, projectDir);

  if (patch === null) {
    return;
  }

  if (patch === '') {
    logger.info('Diff has no changes to apply, proceeding further');
    await installDeps(newVersion, projectDir);
    logger.success(
      `Upgraded React Native to v${newVersion} 🎉. Now you can review and commit the changes`
    );
    return;
  }

  try {
    fs.writeFileSync(tmpPatchFile, patch);
    await execa('git', ['remote', 'add', tmpRemote, rnDiffGitAddress]);
    await execa('git', ['fetch', tmpRemote]);

    try {
      logger.info('Applying diff...');
      await execa(
        'git',
        ['apply', tmpPatchFile, '--exclude=package.json', '-p2', '--3way'],
        { stdio: 'inherit' }
      );
    } catch (error) {
      logger.error(
        `Applying diff failed. Please review the conflicts and resolve them.`
      );
      logger.info(
        `You may find release notes helpful: https://github.com/facebook/react-native/releases/tag/v${newVersion}`
      );
      return;
    }

    await installDeps(newVersion, projectDir);
  } catch (error) {
    throw new Error(error.stderr || error);
  } finally {
    try {
      fs.unlinkSync(tmpPatchFile);
    } catch (e) {
      // ignore
    }
    await execa('git', ['remote', 'remove', tmpRemote]);
  }

  logger.success(
    `Upgraded React Native to v${newVersion} 🎉. Now you can review and commit the changes`
  );
}

const upgradeCommand = {
  name: 'upgrade [version]',
  description:
    "Upgrade your app's template files to the specified or latest npm version using `rn-diff-purge` project. Only valid semver versions are allowed.",
  func: upgrade,
};

export default upgradeCommand;
