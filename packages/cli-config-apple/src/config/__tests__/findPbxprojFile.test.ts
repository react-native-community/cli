import findPbxprojFile from '../findPbxprojFile';
import path from 'path';

describe('findPbxprojFile', () => {
  it('should find project.pbxproj file', () => {
    expect(
      findPbxprojFile({
        path: '.',
        name: 'AwesomeApp.xcodeproj',
        isWorkspace: false,
      }),
    ).toEqual(path.join('AwesomeApp.xcodeproj', 'project.pbxproj'));
  });

  it('should convert .xcworkspace to .xcodeproj and find project.pbxproj file', () => {
    expect(
      findPbxprojFile({
        path: '.',
        name: 'AwesomeApp.xcworkspace',
        isWorkspace: true,
      }),
    ).toEqual(path.join('AwesomeApp.xcodeproj', 'project.pbxproj'));
  });
});
