import execa from 'execa';
import {IosProjectInfo} from '../types';

export function getProjectInfo(sourceDir: string): IosProjectInfo {
  process.chdir(sourceDir);

  const {project} = JSON.parse(
    execa.sync('xcodebuild', ['-list', '-json']).stdout,
  );

  return project;
}
