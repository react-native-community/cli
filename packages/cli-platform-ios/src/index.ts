/**
 * iOS platform files
 */

export {default as commands} from './commands';
export {projectConfig, dependencyConfig, findPodfilePaths} from './config';

export {default as getArchitecture} from './tools/getArchitecture';
export {default as installPods} from './tools/installPods';
export {default as resolvePods} from './tools/pods';
export {default as getSimulators} from './tools/getSimulators';
export {default as listIOSDevices} from './tools/listIOSDevices';
export {default as findXcodeProject} from './config/findXcodeProject';

export {buildProject} from './commands/buildIOS/buildProject';
export {getXcodeProjectAndDir} from './commands/buildIOS/getXcodeProjectAndDir';
export {getConfiguration} from './commands/buildIOS/getConfiguration';

export {runOnDevice} from './commands/runIOS/runOnDevice';
export {runOnSimulator} from './commands/runIOS/runOnSimulator';
