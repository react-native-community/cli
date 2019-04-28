const getDefaultUserTerminal = (): ?string =>
  process.env.REACT_TERMINAL || process.env.TERM_PROGRAM;

export default getDefaultUserTerminal;
