import execa from 'execa';
import {IosProjectInfo} from '../types';

export function getProjectInfo(): IosProjectInfo {
  process.chdir('./ios');
  const {project} = JSON.parse(
    execa.sync('xcodebuild', ['-list', '-json']).stdout,
  );
  process.chdir('..');

  return project;
}
