/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {spawnSync} from 'child_process';
// @ts-ignore untyped
import inquirer from 'inquirer';
import {logger, CLIError} from '@react-native-community/cli-tools';

async function tryLaunchAppOnDevice(
  device: string | void,
  packageNameWithSuffix: string,
  packageName: string,
  adbPath: string,
  mainActivity: string,
  interactive: boolean,
) {
  try {
    const adbArgs = [
      'shell',
      'am',
      'start',
      '-n',
      `${packageNameWithSuffix}/${packageName}.${mainActivity}`,
    ];
    if (device) {
      adbArgs.unshift('-s', device);
      logger.info(`Starting the app on "${device}"...`);
    } else {
      logger.info('Starting the app...');
    }

    // Skip even checking the users if not interactive
    if (interactive) {
      const users = checkUsers(device, adbPath);

      if (users && users.length > 1) {
        const user = await chooseUser(users);

        if (user) {
          // Push '--user USER_ID' after 'start'
          adbArgs.splice(adbArgs.indexOf('start') + 1, 0, '--user', user);
        }
      }
    }

    logger.debug(`Running command "${adbPath} ${adbArgs.join(' ')}"`);
    spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (error) {
    throw new CLIError('Failed to start the app.', error);
  }
}

function checkUsers(device: string | void, adbPath: string) {
  try {
    const adbArgs = ['shell', 'pm', 'list', 'users'];

    if (device) {
      adbArgs.splice(0, 0, '-s', device);
    }

    logger.info(`Checking users on "${device}"...`);
    const {stdout} = spawnSync(adbPath, adbArgs, {encoding: 'utf-8'});
    const regex = new RegExp(/UserInfo{([0-9]*):([^:]*):[0-9]*}/, 'g');
    const users = [];
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
      logger.info(
        `Available users are:\n${users
          .map(user => `${user.name} - ${user.id}`)
          .join('\n')}`,
      );
    }

    return users;
  } catch (error) {
    logger.error('Failed to check users of device.', error);
    return [];
  }
}

async function chooseUser(users: Array<{id: string; name: string}>) {
  const {chosenUserName} = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenUserName',
      message:
        'Which profile would you like to launch your app into?\n(This behaviour can be avoided using the --no-interactive flag)',
      choices: users,
    },
  ]);
  const chosenUser = users.find(user => user.name === chosenUserName);

  return chosenUser && chosenUser.id;
}

export default tryLaunchAppOnDevice;
