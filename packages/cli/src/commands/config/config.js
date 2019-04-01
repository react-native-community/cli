/**
 * @flow
 */
import {type ContextT} from '../../tools/types.flow';
export default {
  name: 'config',
  description: 'Print CLI configuration',
  func: async (argv: string[], ctx: ContextT) => {
    console.log(JSON.stringify(ctx, null, 2));
  },
};
