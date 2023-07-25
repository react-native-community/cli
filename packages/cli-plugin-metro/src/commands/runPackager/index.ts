import {runPackager} from './runPackager';

export default {
  name: 'run-packager-hook',
  description: 'Starts the packager',
  func: runPackager,
  options: [
    {
      name: '--port <number>',
      description: 'Port to run packager on.',
    },
    {
      name: '--terminal <string>',
      description:
        'Launches packager in a new window using the specified terminal path.',
    },
  ],
};
