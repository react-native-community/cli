import semver from 'semver';
import commandExists from 'command-exists';

export enum PACKAGE_MANAGERS {
  YARN = 'YARN',
  NPM = 'NPM',
}

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
  version: string;
  versionRange: string;
}) => {
  const coercedVersion = semver.coerce(version);
  return (
    (version === 'Not Found' ||
      coercedVersion === null ||
      !semver.satisfies(coercedVersion, versionRange)) &&
    `version ${versionRange} is required`
  );
};

export {checkSoftwareInstalled, doesSoftwareNeedToBeFixed};
