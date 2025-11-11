import os from 'os';

const getDefaultUserTerminal = (): string | undefined => {
  const {REACT_TERMINAL, TERM_PROGRAM, TERM, SHELL} = process.env;

  if (REACT_TERMINAL) {
    return REACT_TERMINAL;
  }
	
  if (os.platform() === 'linux') {
    return SHELL;
  }

  if (os.platform() === 'darwin') {
    return TERM_PROGRAM;
  }

  if (os.platform() === 'win32') {
    return 'cmd.exe';
  }

  return TERM;
};

export default getDefaultUserTerminal;
