// @flow
import semver from 'semver';
import commandExists from 'command-exists';

const PACKAGE_MANAGERS = {
  YARN: 'YARN',
  NPM: 'NPM',
};

const checkSoftwareInstalled = async (command: string) => {
  try {
    await commandExists(command);

    return false;
  } catch (_ignored) {
    return 'should be installed';
  }
};

const doesSoftwareNeedToBeFixed = ({
  version,
  versionRange,
}: {
  version: string,
  versionRange: string,
}) =>
  (version === 'Not Found' ||
    !semver.satisfies(semver.coerce(version), versionRange)) &&
  `version ${versionRange} is required`;

export {PACKAGE_MANAGERS, checkSoftwareInstalled, doesSoftwareNeedToBeFixed};
