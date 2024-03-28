import findPbxprojFile from '../findPbxprojFile';

describe('findPbxprojFile', () => {
  it('should find project.pbxproj file', () => {
    expect(
      findPbxprojFile({
        path: '.',
        name: 'AwesomeApp.xcodeproj',
        isWorkspace: false,
      }),
    ).toEqual('AwesomeApp.xcodeproj/project.pbxproj');
  });

  it('should convert .xcworkspace to .xcodeproj and find project.pbxproj file', () => {
    expect(
      findPbxprojFile({
        path: '.',
        name: 'AwesomeApp.xcworkspace',
        isWorkspace: true,
      }),
    ).toEqual('AwesomeApp.xcodeproj/project.pbxproj');
  });
});
