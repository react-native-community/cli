import {IOSProjectInfo} from '@react-native-community/cli-types';
import path from 'path';

function findPbxprojFile(projectInfo: IOSProjectInfo): string {
  return path.join(
    projectInfo.path,
    projectInfo.name.replace('.xcworkspace', '.xcodeproj'),
    'project.pbxproj',
  );
}

export default findPbxprojFile;
