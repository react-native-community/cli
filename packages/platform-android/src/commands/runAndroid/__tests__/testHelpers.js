import fs from 'fs';

jest.mock('fs');
jest.mock('path');

export function createBuildGradleMocks(useFlavor) {
  const actualFs = jest.requireActual('fs');
  const actualPath = jest.requireActual('path');

  fs.readFileSync = jest.fn(filename => {
    switch (filename) {
      case actualPath.join('app', 'build.gradle'):
        return actualFs.readFileSync(
          actualPath.join(
            __dirname,
            '..',
            '__fixtures__',
            useFlavor ? 'sampleBuildWithFlavor.gradle' : 'sampleBuild.gradle',
          ),
          'utf8',
        );
      // Use default case to catch generated debug manifest
      default:
        return actualFs.readFileSync(
          actualPath.join(
            __dirname,
            '..',
            '__fixtures__',
            useFlavor
              ? 'sampleGeneratedDemoDebugManifest.xml'
              : 'sampleGeneratedDebugManifest.xml',
          ),
          'utf8',
        );
    }
  });
}
