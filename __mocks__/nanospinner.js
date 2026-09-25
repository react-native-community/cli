function createSpinner() {
  const spinner = {
    start: () => spinner,
    stop: () => spinner,
    success: () => spinner,
    error: () => spinner,
    warn: () => spinner,
    info: () => spinner,
    clear: () => spinner,
    render: () => spinner,
    update: () => spinner,
    reset: () => spinner,
    spin: () => spinner,
    write: () => spinner,
    loop: () => spinner,
    isSpinning: () => false,
  };
  return spinner;
}

module.exports = {createSpinner};
