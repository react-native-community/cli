import {execaSync} from 'execa';
import {checkUsers} from '../listAndroidUsers';

// output of "adb -s ... shell pm users list" command
const gradleOutput = `
Users:
        UserInfo{0:Homersimpsons:c13} running
        UserInfo{10:Guest:404}
`;

jest.mock('execa', () => ({
  execaSync: jest.fn(),
}));

describe('check android users', () => {
  it('should correctly parse recieved users', () => {
    (execaSync as jest.Mock).mockReturnValueOnce({stdout: gradleOutput});
    const users = checkUsers('device', 'adbPath');

    expect(users).toStrictEqual([
      {id: '0', name: 'Homersimpsons'},
      {id: '10', name: 'Guest'},
    ]);
  });
});
