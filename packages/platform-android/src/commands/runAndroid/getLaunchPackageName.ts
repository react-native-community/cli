import fs from 'fs';
import path from 'path';

function findPreviousTerm(content: string, endPos: number) {
  let pos = endPos;

  while (content[pos] === ' ') {
    --pos;
  }

  const regex = /\w/;
  const word = [];

  while (regex.exec(content[pos])) {
    word.push(content[pos]);
    --pos;
  }

  return word.reverse().join('');
}

/**
 * Read the gradle file and get list of buildTypes defined for the project.
 */
function findBuildTypes(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /buildTypes+/gi;
  const buildTypes = [];
  const match = regex.exec(content);

  if (!match) {
    // Assume default types if buildTypes is not present
    return ['debug', 'release'];
  }

  const buildTypeStartPos = regex.lastIndex;
  let counter = 1;
  let pos = buildTypeStartPos + 1;

  while (counter > 0) {
    if (content[pos] === '{') {
      counter += 1;
      if (counter === 2) {
        const previousTerm = findPreviousTerm(content, pos - 1);
        if (buildTypes.indexOf(previousTerm) === -1) {
          buildTypes.push(previousTerm);
        }
      }
    } else if (content[pos] === '}') {
      --counter;
    }
    ++pos;
  }

  return buildTypes;
}

/**
 *
 * Split the variant into buildType and flavor
 */
function splitVariant(gradleFilePath: string, variant: string) {
  const buildTypes = findBuildTypes(gradleFilePath);
  const regexp = new RegExp(buildTypes.join('|'), 'gi');
  const match = regexp.exec(variant);

  let flavor = null;
  let buildType = variant;

  if (match) {
    flavor = variant.substring(0, match.index);
    buildType = variant.substring(match.index);
  }

  return {buildType, flavor};
}

/**
 * Check if separate is build enabled for different processors
 */
function isSeparateBuildEnabled(gradleFilePath: string) {
  const content = fs.readFileSync(gradleFilePath, 'utf8');
  const match = content.match(/(\w+)\senableSeparateBuildPerCPUArchitecture/);

  let separateBuild = '';

  if (match != null) {
    separateBuild = match[1];
  }

  return separateBuild.toLowerCase() === 'enable';
}

/**
 * Get the path to the correct manifest file to find the correct package name to be used while
 * starting the app
 */
function getManifestFile(variant: string) {
  const gradleFilePath = path.join('app', 'build.gradle');

  // We first need to identify build type and flavor from the specified variant
  const {buildType, flavor} = splitVariant(gradleFilePath, variant);

  // Using the buildtype and flavor we create the path to the correct AndroidManifest.xml
  const paths = ['app', 'build', 'intermediates', 'merged_manifests'];
  if (flavor) {
    paths.push(flavor);
  }

  if (isSeparateBuildEnabled(gradleFilePath)) {
    paths.push('x86');
  }

  paths.push(buildType);
  paths.push('AndroidManifest.xml');

  return path.join(...paths);
}

export default function getLaunchPackageName(variant: string) {
  const manifestFile = getManifestFile(variant || 'debug');
  const content = fs.readFileSync(manifestFile, 'utf8');

  const matched = content.match(/package="(.+?)"/);
  let packageName = '';

  if (matched != null) {
    packageName = matched[1];
  }

  return packageName;
}
