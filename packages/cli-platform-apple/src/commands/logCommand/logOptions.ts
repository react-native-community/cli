import {BuilderCommand} from '../../types';

export const getLogOptions = ({}: BuilderCommand) => [
  {
    name: '-i --interactive',
    description:
      'Explicitly select simulator to tail logs from. By default it will tail logs from the first booted and available simulator.',
  },
];
