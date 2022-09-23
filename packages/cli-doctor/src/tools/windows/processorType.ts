/**
 * Returns if the processor is Intel or AMD
 */
export const getProcessorType = () => {
  return process.env.PROCESSOR_IDENTIFIER!.includes('Intel') ? 'Intel' : 'AMD';
};
