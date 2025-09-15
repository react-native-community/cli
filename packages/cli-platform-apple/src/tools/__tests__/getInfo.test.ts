import type {IOSProjectInfo} from '@react-native-community/cli-types';

import {execaSync} from 'execa';
import fs from 'fs';
import {getInfo} from '../getInfo';

jest.mock('execa', () => ({
  execaSync: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('getInfo', () => {
  it('handles non-project / workspace locations in a ', () => {
    const name = `YourProjectName`;
    (fs.readFileSync as jest.Mock)
      .mockReturnValueOnce(`<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:${name}.xcodeproj">
   </FileRef>
   <FileRef
      location = "group:Pods/Pods.xcodeproj">
   </FileRef>
   <FileRef
      location = "group:container/some_other_file.mm">
   </FileRef>
</Workspace>`);
    (execaSync as jest.Mock).mockReturnValue({stdout: '{}'});
    getInfo({isWorkspace: true, name} as IOSProjectInfo, 'some/path');

    // Should not call on Pods or the other misc groups
    expect((execaSync as jest.Mock).mock.calls).toEqual([
      [
        'xcodebuild',
        ['-list', '-json', '-project', `some/path/${name}.xcodeproj`],
      ],
    ]);
  });
});
