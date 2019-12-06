import fs from 'fs';
import versionRanges from '../versionRanges';
import {
  PACKAGE_MANAGERS,
  doesSoftwareNeedToBeFixed,
} from '../checkInstallation';
import {install} from '../../../tools/install';
import {HealthCheckInterface} from '../types';

const packageManager = (() => {
  if (fs.existsSync('yarn.lock')) {
    return PACKAGE_MANAGERS.YARN;
  }

  if (fs.existsSync('package-lock.json')) {
    return PACKAGE_MANAGERS.NPM;
  }

  return undefined;
})();

const yarn: HealthCheckInterface = {
  label: 'yarn',
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Yarn.version,
      versionRange: versionRanges.YARN,
    }),
    version: Binaries.Yarn.version,
    versionRange: versionRanges.YARN,
  }),
  // Only show `yarn` if there's a `yarn.lock` file in the current directory
  // or if we can't identify that the user uses yarn or npm
  visible:
    packageManager === PACKAGE_MANAGERS.YARN || packageManager === undefined,
  runAutomaticFix: async ({loader}) =>
    await install({
      pkg: 'yarn',
      label: 'yarn',
      url: 'https://yarnpkg.com/docs/install',
      loader,
    }),
};

const npm: HealthCheckInterface = {
  label: 'npm',
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.npm.version,
      versionRange: versionRanges.NPM,
    }),
    version: Binaries.npm.version,
    versionRange: versionRanges.NPM,
  }),
  // Only show `yarn` if there's a `package-lock.json` file in the current directory
  // or if we can't identify that the user uses yarn or npm
  visible:
    packageManager === PACKAGE_MANAGERS.NPM || packageManager === undefined,
  runAutomaticFix: async ({loader}) =>
    await install({
      pkg: 'node',
      label: 'node',
      url: 'https://nodejs.org/',
      loader,
    }),
};

export {packageManager, yarn, npm};
