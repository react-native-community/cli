import fs from 'fs';
import dependencies from '../dependencies';
import {EnvironmentInfo} from '../../../types';

describe('dependencies', () => {
  let environmentInfo: EnvironmentInfo;
  let dependenciesJSON: string;

  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => dependenciesJSON);
  });

  it('returns false if dependencies are correct', async () => {
    dependenciesJSON = JSON.stringify({
      name: 'AwesomeProject',
      dependencies: {
        'react-native': '0.72.1',
      },
    });

    const diagnostics = await dependencies.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(false);
  });

  it('returns true if dependencies contains an incompatible version react native package', async () => {
    dependenciesJSON = JSON.stringify({
      name: 'AwesomeProject',
      dependencies: {
        'react-native': '0.72.1',
        '@react-native/codegen': '1.72.3',
        '@react-native/gradle-plugin': '0.69.10',
      },
    });

    const diagnostics = await dependencies.getDiagnostics(environmentInfo);
    expect(diagnostics.needsToBeFixed).toBe(true);
  });

  it('warn if dependencies contains an compatible version of react native packages', async () => {
    dependenciesJSON = JSON.stringify({
      name: 'AwesomeProject',
      dependencies: {
        'react-native': '0.72.1',
        '@react-native/codegen': '0.72.1',
      },
    });

    const diagnostics = await dependencies.getDiagnostics(environmentInfo);
    expect(diagnostics.description).toMatch(
      '@react-native/codegen is part of React Native and should not be a dependency in your package.json',
    );
  });
});
