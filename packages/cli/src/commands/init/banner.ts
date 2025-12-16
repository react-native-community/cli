import pico from 'picocolors';

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
  return `${pico.cyan(reactLogoArray.join('\n'))}

${pico.cyanBright(pico.bold(getWelcomeMessage(reactNativeVersion)))}
${pico.dim(learnOnceMessage)}
`;
}
