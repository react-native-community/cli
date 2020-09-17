import * as androidWinHelpers from '../androidWinHelpers';
import * as executeWinCommand from '../executeWinCommand';
import * as processorType from '../processorType';
import {ExecaChildProcess} from 'execa';

describe('androidWinHelpers', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('gestBestHypervisor returns the right information depending on the system', async () => {
    const notInstalledAndAvailable = {
      output: `
accel:
0
HAXM is not installed, but Windows Hypervisor Platform is available.
accel`,
      expectedResult: {
        hypervisor: 'WHPX',
        installed: false,
      },
      processor: 'Intel',
    };

    const notInstalledAndAvailableAMDH = {
      output: `
accel:
0
Android Emulator requires an Intel processor with VT-x and NX support.  Your CPU: 'AuthenticAMD'
accel`,
      expectedResult: {
        hypervisor: 'AMDH',
        installed: false,
      },
      processor: 'AMD',
    };

    const installedAndUsable = {
      output: `
accel:
0
WHPX (10.0.19041) is installed and usable.
accel`,
      expectedResult: {
        hypervisor: 'WHPX',
        installed: true,
      },
      processor: 'Intel',
    };

    const customInstalledAndUsableHAXM = {
      output: `
accel:
0
HAXM version 6.2.1 (4) is installed and usable.
accel`,
      expectedResult: {
        hypervisor: 'HAXM',
        installed: true,
      },
      processor: 'Intel',
    };

    const notInstalledNotUsable = {
      output: `
accel:
0
HAXM is not installed on this machine
accel`,
      expectedResult: {
        hypervisor: 'none',
        installed: false,
      },
      processor: 'Intel',
    };

    const hyperVisorScenarios = [
      notInstalledAndAvailable,
      notInstalledAndAvailableAMDH,
      installedAndUsable,
      customInstalledAndUsableHAXM,
      notInstalledNotUsable,
    ];

    const executeCommandSpy = jest.spyOn(executeWinCommand, 'executeCommand');
    const processorTypeSpy = jest.spyOn(processorType, 'getProcessorType');

    for (const {output, expectedResult, processor} of hyperVisorScenarios) {
      executeCommandSpy.mockResolvedValue(({
        stdout: output,
      } as any) as ExecaChildProcess);
      processorTypeSpy.mockReturnValue(processor as 'Intel' | 'AMD');
      const result = await androidWinHelpers.getBestHypervisor('');
      expect(result).toEqual(expectedResult);
    }
  });
});
