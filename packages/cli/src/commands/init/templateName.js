// @flow
import path from 'path';
import {URL} from 'url';
import {fetch} from '../../tools/fetch';

const FILE_PROTOCOL = /file:/;
const HTTP_PROTOCOL = /https?:/;
const TARBALL = /\.tgz$/;
const VERSION_POSTFIX = /(.*)(-\d+\.\d+\.\d+)/;
const VERSIONED_PACKAGE = /(@?.*)(@)(.*)/;

function handleFileProtocol(filePath: string) {
  const uri = new URL(filePath).pathname;

  return {
    uri,
    name: require(path.join(uri, 'package.json')).name,
  };
}

function handleTarball(filePath: string) {
  const nameWithVersion = path.parse(path.basename(filePath)).name;
  const tarballVersionMatch = nameWithVersion.match(VERSION_POSTFIX);
  if (!tarballVersionMatch) {
    throw new Error(
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
    throw new Error(
      `Failed to retrieve package name. We expect the package to include name and version, e.g.: "template-name@1.2.3-rc.0", but received: "${versionedPackage}".`,
    );
  }
  return {
    uri: versionedPackage,
    name: versionedPackageMatch[1],
  };
}

export async function processTemplateName(templateName: string) {
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
