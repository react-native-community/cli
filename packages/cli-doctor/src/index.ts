import doctor from './commands/doctor';
import info from './commands/info';

export const commands = {info, doctor};

/**
 * @todo
 * We should not rely on this file from other packages, e.g. CLI. We probably need to
 * refactor the init in order to remove that connection.
 */
export {default as installPods} from './tools/installPods';
