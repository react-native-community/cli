import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';
import printRunInstructions from '../printRunInstructions';

const PROJECT_DIR = '/projects/MyApp';
const SPM_COMMAND = 'npx react-native spm add --deintegrate';

const originalPlatform = process.platform;

function printedOutput() {
  return (logger.log as jest.Mock).mock.calls.flat().join('\n');
}

function mockWorkspaceExists(exists: boolean) {
  jest
    .spyOn(fs, 'existsSync')
    .mockImplementation(
      (file) => exists && String(file).endsWith('.xcworkspace'),
    );
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
  Object.defineProperty(process, 'platform', {value: 'darwin'});
});

afterAll(() => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
});

describe('printRunInstructions', () => {
  it('points at the Xcode project without pod steps when SwiftPM was set up', () => {
    mockWorkspaceExists(true);

    printRunInstructions(PROJECT_DIR, 'MyApp', {
      showPodsInstructions: true,
      spmSetup: 'done',
    });

    const output = printedOutput();
    expect(output).toContain('MyApp.xcodeproj');
    expect(output).not.toContain('MyApp.xcworkspace');
    expect(output).not.toContain('pod install');
    expect(output).not.toContain('Cocoapods');
    expect(output).not.toContain(SPM_COMMAND);
    expect(output).toContain(`cd "${PROJECT_DIR}"\n`);
  });

  it('tells the user to set up SwiftPM when it is still pending', () => {
    mockWorkspaceExists(false);

    printRunInstructions(PROJECT_DIR, 'MyApp', {
      showPodsInstructions: true,
      spmSetup: 'pending',
    });

    const output = printedOutput();
    expect(output).toContain(SPM_COMMAND);
    expect(output).toContain('once dependencies are installed');
    expect(output).toContain('MyApp.xcodeproj');
    expect(output).not.toContain('pod install');
    expect(output).toContain(`cd "${PROJECT_DIR}"\n`);
  });

  it('tells the user to retry the SwiftPM setup when it failed', () => {
    mockWorkspaceExists(false);

    printRunInstructions(PROJECT_DIR, 'MyApp', {
      showPodsInstructions: true,
      spmSetup: 'failed',
    });

    const output = printedOutput();
    expect(output).toContain(
      `Retry the Swift Package Manager setup\n      • ${SPM_COMMAND}`,
    );
    expect(output).not.toContain('once dependencies are installed');
    expect(output).toContain('Open the iOS project in Xcode with "xed -b ios"');
    expect(output).not.toContain('MyApp.xcodeproj');
    expect(output).not.toContain('MyApp.xcworkspace');
    expect(output).not.toContain('pod install');
    expect(output).toContain(`cd "${PROJECT_DIR}"\n`);
  });

  it('keeps the CocoaPods instructions when pods were not installed', () => {
    mockWorkspaceExists(false);

    printRunInstructions(PROJECT_DIR, 'MyApp', {showPodsInstructions: true});

    const output = printedOutput();
    expect(output).toContain('bundle exec pod install');
    expect(output).toContain(`cd "${PROJECT_DIR}/ios"`);
    expect(output).not.toContain(SPM_COMMAND);
  });

  it('points at the workspace when CocoaPods were installed', () => {
    mockWorkspaceExists(true);

    printRunInstructions(PROJECT_DIR, 'MyApp', {showPodsInstructions: false});

    const output = printedOutput();
    expect(output).toContain('MyApp.xcworkspace');
    expect(output).not.toContain('pod install');
    expect(output).not.toContain(SPM_COMMAND);
  });
});
