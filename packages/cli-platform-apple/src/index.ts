export {
  getDependencyConfig,
  getProjectConfig,
  findPodfilePaths,
} from './config';

export {getBuildOptions} from './commands/buildCommand/buildOptions';
export {getLogOptions} from './commands/logCommand/logOptions';
export {getRunOptions} from './commands/runCommand/runOptions';

export {default as createBuild} from './commands/buildCommand/createBuild';
export {default as createLog} from './commands/logCommand/createLog';
export {default as createRun} from './commands/runCommand/createRun';

export {default as getArchitecture} from './tools/getArchitecture';
export {default as installPods} from './tools/installPods';

export {default as findXcodeProject} from './config/findXcodeProject';
export {default as findPbxprojFile} from './config/findPbxprojFile';
console.log('do not fire win CI');
