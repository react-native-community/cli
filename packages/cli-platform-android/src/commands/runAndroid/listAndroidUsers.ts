import execa from 'execa';
import {logger, prompt} from '@react-native-community/cli-tools';

type User = {
  id: string;
  name: string;
};

export function checkUsers(device: string, adbPath: string) {
  try {
    const adbArgs = ['-s', device, 'shell', 'pm', 'list', 'users'];

    logger.debug(`Checking users on "${device}"...`);
    const {stdout} = execa.sync(adbPath, adbArgs, {encoding: 'utf-8'});
    const regex = new RegExp(
      /^\s*UserInfo\{(?<userId>\d+):(?<userName>.*):(?<userFlags>[0-9a-f]*)}/,
    );
    const users: User[] = [];

    const lines = stdout.split('\n');
    for (const line of lines) {
      const res = regex.exec(line);
      if (res?.groups) {
        users.push({id: res.groups.userId, name: res.groups.userName});
      }
    }

    if (users.length > 1) {
      logger.debug(
        `Available users are:\n${users
          .map((user) => `${user.name} - ${user.id}`)
          .join('\n')}`,
      );
    }

    return users;
  } catch (error) {
    logger.error('Failed to check users of device.', error as any);
    return [];
  }
}

export async function promptForUser(users: User[]) {
  const {selectedUser}: {selectedUser: User} = await prompt({
    type: 'select',
    name: 'selectedUser',
    message: 'Which profile would you like to launch your app into?',
    choices: users.map((user: User) => ({
      title: user.name,
      value: user,
    })),
    min: 1,
  });

  return selectedUser;
}
