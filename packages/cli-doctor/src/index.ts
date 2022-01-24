import doctor from './commands/doctor';
import info from './commands/info';

export {logManualInstallation, logError} from './tools/healthchecks/common';

export const commands = {info, doctor};
