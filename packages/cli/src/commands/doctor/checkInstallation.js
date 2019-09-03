import semver from 'semver';
import commandExists from 'command-exists';

const PACKAGE_MANAGERS = {
  YARN: 'YARN',
  NPM: 'NPM',
};

const isSoftwareInstalled = async command => {
  try {
    await commandExists(command);

    return true;
  } catch (_ignored) {
    return false;
  }
};

const doesSoftwareNeedToBeFixed = ({version, versionRange}) =>
  version === 'Not Found' ||
  !semver.satisfies(semver.coerce(version), versionRange);

export {PACKAGE_MANAGERS, isSoftwareInstalled, doesSoftwareNeedToBeFixed};
