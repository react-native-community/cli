import os from 'os';

const getDefaultUserTerminal = (): string | undefined => {
  const {REACT_TERMINAL, TERM_PROGRAM, TERM} = process.env;

  if (REACT_TERMINAL) {
    return REACT_TERMINAL;
  }

  if (os.platform() === 'darwin') {
    return TERM_PROGRAM;
  }

  return TERM;
};

export default getDefaultUserTerminal;
