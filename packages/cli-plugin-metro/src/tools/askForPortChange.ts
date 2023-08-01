import {prompt} from '@react-native-community/cli-tools';

const askForPortChange = async (port: number) => {
  return await prompt({
    name: 'change',
    type: 'select',
    message: `Use port ${port} instead?`,
    choices: [
      {title: 'Yes', value: true},
      {title: 'No', value: false},
    ],
  });
};

export default askForPortChange;
