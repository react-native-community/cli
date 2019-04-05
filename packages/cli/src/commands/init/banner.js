// @flow
import chalk from 'chalk';

const reactLogoArray = [
  '                                                          ',
  '               ######                ######               ',
  '             ###     ####        ####     ###             ',
  '            ##          ###    ###          ##            ',
  '            ##             ####             ##            ',
  '            ##             ####             ##            ',
  '            ##           ##    ##           ##            ',
  '            ##         ###      ###         ##            ',
  '             ##  ########################  ##             ',
  '          ######    ###            ###    ######          ',
  '      ###     ##    ##              ##    ##     ###      ',
  '   ###         ## ###      ####      ### ##         ###   ',
  '  ##           ####      ########      ####           ##  ',
  ' ##             ###     ##########     ###             ## ',
  '  ##           ####      ########      ####           ##  ',
  '   ###         ## ###      ####      ### ##         ###   ',
  '      ###     ##    ##              ##    ##     ###      ',
  '          ######    ###            ###    ######          ',
  '             ##  ########################  ##             ',
  '            ##         ###      ###         ##            ',
  '            ##           ##    ##           ##            ',
  '            ##             ####             ##            ',
  '            ##             ####             ##            ',
  '            ##          ###    ###          ##            ',
  '             ###     ####        ####     ###             ',
  '               ######                ######               ',
  '                                                          ',
];

const welcomeMessage =
  '                  Welcome to React Native!                ';
const learnOnceMessage =
  '                 Learn Once Write Anywhere                ';

export default `${chalk.blue(reactLogoArray.join('\n'))}

${chalk.yellow.bold(welcomeMessage)}
${chalk.gray(learnOnceMessage)}
`;
