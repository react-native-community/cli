import path from 'path';

export type CommandLineArgs = {
  save?: boolean,
  quality?: number,
  include?: string,
  exclude?: string,
};

export default [
  {
    name: '--save',
    description: 'Backup a copy of each file with a .orig extension',
    default: false,
  },
  {
    name: '--quality [number]',
    description:
      'Compress the images to a certain integer quality N between 1 and 100 (defaults to 60)',
    parse: (quality: string) => Number(quality),
  },
  {
    name: 'include <string>',
    description: 'Only optimize assets that match this glob pattern',
  },
  {
    name: 'exclude <string>',
    description: 'Exclude assets that match this glob pattern',
  },
];
