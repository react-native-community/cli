/**
 * @flow
 */
import {type ConfigT} from '../../tools/config/types.flow';
export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async (argv: string[], ctx: ConfigT) => {
    console.log(JSON.stringify(ctx, null, 2));
  },
};
