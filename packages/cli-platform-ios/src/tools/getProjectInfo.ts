import execa from 'execa';
import {IosProjectInfo} from '../types';

export function getProjectInfo(): IosProjectInfo | undefined {
  try {
    const out = execa.sync('xcodebuild', ['-list', '-json']).stdout;
    const {project} = JSON.parse(out);
    return project;
  } catch (error) {
    if (
      (error as Error)?.message &&
      (error as Error).message.includes('xcodebuild: error:')
    ) {
      const match = (error as Error).message.match(/xcodebuild: error: (.*)/);
      const err = match ? match[0] : error;
      throw new Error(err as any);
    }
    throw new Error(error as any);
  }
}
