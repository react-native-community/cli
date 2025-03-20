import {getBuildConfigurationFromXcScheme} from '../getBuildConfigurationFromXcScheme';
import fs from 'fs';
import path from 'path';
import {CLIError} from '@react-native-community/cli-tools';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

describe('getBuildConfigurationFromXcScheme', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns build configuration when the shared scheme file exists', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(['Test.xcodeproj']);

    const xmlContent = `<Scheme>
  <LaunchAction buildConfiguration="Debug"/>
</Scheme>`;
    (fs.readFileSync as jest.Mock).mockReturnValue(xmlContent);

    const sourceDir = '/some/dir';
    const scheme = 'Test';
    const defaultConfig = 'Release';
    const projectInfo = {name: 'Test', schemes: [scheme]};

    const result = getBuildConfigurationFromXcScheme(
      scheme,
      defaultConfig,
      sourceDir,
      projectInfo,
    );

    expect(result).toBe('Debug');

    const expectedPath = path.join(
      sourceDir,
      'Test.xcodeproj',
      'xcshareddata',
      'xcschemes',
      `${scheme}.xcscheme`,
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, {
      encoding: 'utf-8',
    });
  });

  it('throws CLIError when reading the shared scheme file fails', () => {
    process.env.NO_COLOR = '1'; // To disable picocolors
    (fs.readdirSync as jest.Mock).mockReturnValue(['Test.xcodeproj']);
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    const sourceDir = '/some/dir';
    const scheme = 'Test';
    const defaultConfig = 'Release';
    const projectInfo = {name: 'Test', schemes: [scheme]};

    expect(() => {
      getBuildConfigurationFromXcScheme(
        scheme,
        defaultConfig,
        sourceDir,
        projectInfo,
      );
    }).toThrow(CLIError);

    try {
      getBuildConfigurationFromXcScheme(
        scheme,
        defaultConfig,
        sourceDir,
        projectInfo,
      );
    } catch (err) {
      const msg = (err as CLIError).message;
      expect(msg).toContain(`Could not load the shared scheme for ${scheme}`);
      expect(msg).toContain(`includes: ${projectInfo.schemes[0]}`);
    }
  });

  it('returns the default configuration when no .xcodeproj folder is found', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    const sourceDir = '/some/dir';
    const scheme = 'Test';
    const defaultConfig = 'Release';
    const result = getBuildConfigurationFromXcScheme(
      scheme,
      defaultConfig,
      sourceDir,
      undefined,
    );

    expect(result).toBe(defaultConfig);
  });
});
