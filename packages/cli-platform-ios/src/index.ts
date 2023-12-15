/**
 * iOS platform files
 */

export {default as commands} from './commands';
export {projectConfig, dependencyConfig, findPodfilePaths} from './config';

export {default as getArchitecture} from './tools/getArchitecture';
export {default as installPods} from './tools/installPods';

// TODO: Move this to `cli-platform-apple`
export {commandBuilder as buildPlatformCommand} from './commands/buildIOS';
export {commandBuilder as buildPlatformRunCommand} from './commands/runIOS';
export {commandBuilder as buildPlatformLogCommand} from './commands/logIOS';
