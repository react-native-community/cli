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

const getWelcomeMessage = (reactNativeVersion: string = '') => {
  if (reactNativeVersion) {
    return `              Welcome to React Native ${reactNativeVersion}!                `;
  }
  return '                  Welcome to React Native!                ';
};
const learnOnceMessage =
  '                 Learn once, write anywhere               ';

export default function banner(reactNativeVersion?: string) {
  return `${chalk.cyan(reactLogoArray.join('\n'))}

${chalk.cyanBright.bold(getWelcomeMessage(reactNativeVersion))}
${chalk.dim(learnOnceMessage)}
`;
}
