import fs from 'fs';

import {CpuProfilerModel} from './cpuProfilerModel';
import {changeNamesToSourceMaps} from './sourceMapper';
import {DurationEvent, SourceMap} from './EventInterfaces';

export const transformer = async (
  profilePath: string,
  sourceMapPath: string | undefined,
  bundleFileName: string | undefined,
): Promise<DurationEvent[]> => {
  //   console.log('profilePath: ', profilePath);
  //   console.log('souceMapPath: ', sourceMapPath);
  //   console.log('bundleFileName: ', bundleFileName);
  const hermesProfile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  //console.log('done parsing hermes profile');
  const profileChunk = CpuProfilerModel.collectProfileEvents(hermesProfile);
  //console.log('done constructing the profile chunk');
  const profiler = new CpuProfilerModel(profileChunk);
  const chromeEvents = profiler.createStartEndEvents();
  //console.log(chromeEvents[0]);
  //console.log('done generating chrome events');
  if (sourceMapPath) {
    const sourceMap: SourceMap = JSON.parse(
      fs.readFileSync(sourceMapPath, 'utf-8'),
    );
    //console.log('done parsing source map file');
    const events = await changeNamesToSourceMaps(
      sourceMap,
      chromeEvents,
      bundleFileName,
    );
    //console.log(events[0]);
    return events;
  }
  return chromeEvents;
};
