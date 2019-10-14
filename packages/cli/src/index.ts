import './tools/gracefulifyFs';

import {run} from './cliEntry';

if (require.main === module) {
  run();
}

export * from './cliEntry';
