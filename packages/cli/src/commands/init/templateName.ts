import path from 'path';
import {URL} from 'url';
import fs from 'fs';
import {CLIError} from '@react-native-community/cli-tools';

const FILE_PROTOCOL = /file:/;
const TARBALL = /\.tgz$/;
const VERSION_POSTFIX = /(.*)(-\d+\.\d+\.\d+)/;
const VERSIONED_PACKAGE = /(@?.+)(@)(.+)/;

function handleFileProtocol(filePath: string) {
  let uri = new URL(filePath).pathname;
  if (process.platform === 'win32') {
    // On Windows, the pathname has an extra / at the start, so remove that
    uri = uri.substring(1);
  }
  if (!fs.existsSync(uri)) {
    throw new CLIError(
      `Failed to retrieve template name. The specified template directory path "${uri}" does not exist or is invalid.`,
    );
  }
  const packageJsonPath = path.join(uri, 'package.json');
  let packageJson;
  try {
    packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, {encoding: 'utf8'}),
    );
  } catch {
    throw new CLIError(
      'Failed to retrieve template name. We expect the template directory to include "package.json" file, but it was not found.',
    );
  }

  if (!packageJson || !packageJson.name) {
    throw new CLIError(
      `Failed to retrieve template name. We expect the "package.json" of the template to include the "name" property, but we found "${
        packageJson ? packageJson.name : 'undefined'
      }" which is invalid.`,
    );
  }
  return {
    uri,
    name: packageJson.name,
  };
}

function handleTarball(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new CLIError(
      `Failed to retrieve tarball name. The specified tarball path "${filePath}" does not exist or is invalid.`,
    );
  }
  const nameWithVersion = path.parse(path.basename(filePath)).name;
  const tarballVersionMatch = nameWithVersion.match(VERSION_POSTFIX);
  if (!tarballVersionMatch) {
    throw new CLIError(
      `Failed to retrieve tarball name. We expect the tarball to include package name and version, e.g.: "template-name-1.2.3-rc.0.tgz", but received: "${nameWithVersion}".`,
    );
  }

  return {
    uri: filePath,
    name: tarballVersionMatch[1],
  };
}

function handleVersionedPackage(versionedPackage: string) {
  const versionedPackageMatch = versionedPackage.match(VERSIONED_PACKAGE);
  if (!versionedPackageMatch) {
    throw new CLIError(
      `Failed to retrieve package name. We expect the package to include name and version, e.g.: "template-name@1.2.3-rc.0", but received: "${versionedPackage}".`,
    );
  }
  return {
    uri: versionedPackage,
    name: versionedPackageMatch[1],
  };
}

export function processTemplateName(templateName: string) {
  if (templateName.match(TARBALL)) {
    return handleTarball(templateName);
  }
  if (templateName.match(FILE_PROTOCOL)) {
    return handleFileProtocol(templateName);
  }
  if (templateName.match(VERSIONED_PACKAGE)) {
    return handleVersionedPackage(templateName);
  }

  return {
    uri: templateName,
    name: templateName,
  };
}
