import fs from 'fs';

function findPreviousTerm(content, endPos) {
  while (content[endPos] === ' ') {
    --endPos;
  }
  const regex = new RegExp('\\w');
  const word = [];
  while (regex.exec(content[endPos])) {
    word.push(content[endPos]);
    --endPos;
  }
  return word.reverse().join('');
}

function findBuildTypes(filePath) {
  // Read the gradle file and get list of buildTypes defined for the project.
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp('buildType\\s+{', 'ig');
  const buildTypes = ['debug', 'release'];
  const match = regex.exec(content);
  if (!match) {
    return buildTypes;
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

function splitVariant(gradleFilePath, variant) {
  // Split the variant into buildType and flavor
  const buildTypes = findBuildTypes(gradleFilePath, 'buildTypes', [
    'debug',
    'release',
  ]);
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

function isSeparateBuildEnabled(gradleFilePath) {
  // Check if separate build enabled for different processors
  const content = fs.readFileSync(gradleFilePath, 'utf8');
  const separateBuild = content.match(
    /enableSeparateBuildPerCPUArchitecture\s+=\s+([\w]+)/,
  )[1];
  return separateBuild.toLowerCase() === 'true';
}

function getManifestFile(variant) {
  // get the path to the correct manifest file to find the correct package name to be used while
  // starting the app
  const gradleFilePath = 'app/build.gradle';

  // We first need to identify build type and flavor from the specified variant
  const {buildType, flavor} = splitVariant(gradleFilePath, variant);

  // Using the buildtype and flavor we create the path to the correct AndroidManifest.xml
  const paths = ['app/build/intermediates/merged_manifests/'];
  if (flavor) {
    paths.push(flavor);
  }

  if (isSeparateBuildEnabled(gradleFilePath)) {
    paths.push('x86');
  }

  paths.push(buildType);
  paths.push('AndroidManifest.xml');
  return paths.join('/');
}

export default function getLaunchPackageName(variant) {
  // Get the complete launch path, as specified by the gradle build script
  const manifestFile = getManifestFile(variant || 'debug');
  const content = fs.readFileSync(manifestFile, 'utf8');

  // Get the package name to launch, specified by the generated manifest file
  const packageName = content.match(/package="(.+?)"/)[1];

  return packageName;
}
