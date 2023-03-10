import {logger} from '@react-native-community/cli-tools';
import {spawnSync} from 'child_process';
import prompts from 'prompts';

type User = {
  id: string;
  name: string;
};

export function checkUsers(device: string, adbPath: string) {
  try {
    const adbArgs = ['-s', device, 'shell', 'pm', 'list', 'users'];

    logger.debug(`Checking users on "${device}"...`);
    const {stdout} = spawnSync(adbPath, adbArgs, {encoding: 'utf-8'});
    const regex = new RegExp(/UserInfo{([0-9]*):([^:]*):[0-9]*}/, 'g');
    const users: User[] = [];
    let end = false;

    while (!end && stdout) {
      const result = regex.exec(stdout.toString());

      if (!result) {
        end = true;
      } else {
        users.push({
          id: result[1],
          name: result[2],
        });
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
  const {selectedUser}: {selectedUser: User} = await prompts({
    type: 'select',
    name: 'selectedUser',
    message: 'Which profile would you like to launch your app into?',
    choices: users.map((user: User) => ({
      title: user.name,
      value: user,
    })),
    min: 1,
  });

  // const {chosenUserName} = await prompts ([
  //   {
  //     type: 'list',
  //     name: 'chosenUserName',
  //     message:
  //       'Which profile would you like to launch your app into?\n(This behaviour can be avoided using the --no-interactive flag)',
  //     choices: users,
  //   },
  // ]);
  // const chosenUser = users.find(user => user.name === chosenUserName);

  return selectedUser;
}
