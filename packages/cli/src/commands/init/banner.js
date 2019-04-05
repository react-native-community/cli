// @flow
import chalk from 'chalk';

const reactLogoArray = [
  '                                                                ',
  '                                                                ',
  '                                                                ',
  '                  ######                ######                  ',
  '                ###     ####        ####     ###                ',
  '               ##          ###    ###          ##               ',
  '               ##             ####             ##               ',
  '               ##             ####             ##               ',
  '               ##           ##    ##           ##               ',
  '               ##         ###      ###         ##               ',
  '                ##  ########################  ##                ',
  '             ######    ###            ###    ######             ',
  '         ###     ##    ##              ##    ##     ###         ',
  '      ###         ## ###      ####      ### ##         ###      ',
  '     ##           ####      ########      ####           ##     ',
  '    ##             ###     ##########     ###             ##    ',
  '     ##           ####      ########      ####           ##     ',
  '      ###         ## ###      ####      ### ##         ###      ',
  '         ###     ##    ##              ##    ##     ###         ',
  '             ######    ###            ###    ######             ',
  '                ##  ########################  ##                ',
  '               ##         ###      ###         ##               ',
  '               ##           ##    ##           ##               ',
  '               ##             ####             ##               ',
  '               ##             ####             ##               ',
  '               ##          ###    ###          ##               ',
  '                ###     ####        ####     ###                ',
  '                  ######                ######                  ',
  '                                                                ',
  '                                                                ',
  '                                                                ',
  '                                                                ',
];

const welcomeMessage = '                   Welcome to React Native!';
const heyThere =
  'Hey there! I am going to initialize a fresh react-native project: ';

export default `${chalk.blue(reactLogoArray.join('\n'))}
${chalk.yellow.bold(welcomeMessage)}

${heyThere}
`;
