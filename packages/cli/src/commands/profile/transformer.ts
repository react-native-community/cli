import fs from 'fs';

import {CpuProfilerModel} from './cpuProfilerModel';
import {changeNamesToSourceMaps} from './sourceMapper';
import {DurationEvent, SourceMap} from './EventInterfaces';

export const transformer = async (
  profilePath: string,
  sourceMapPath: string | undefined,
  bundleFileName: string | undefined,
): Promise<DurationEvent[]> => {
  //console.log('sourceMapPath: ', sourceMapPath);
  //console.log('profile: ', profilePath);
  //TODO: parse JSON file: check whether the file is empty
  const hermesProfile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  //console.log('hermes profile: ', hermesProfile.samples[0]);
  const profileChunk = CpuProfilerModel.collectProfileEvents(hermesProfile);
  const profiler = new CpuProfilerModel(profileChunk);
  const chromeEvents = profiler.createStartEndEvents();
  if (sourceMapPath) {
    const sourceMap: SourceMap = JSON.parse(
      fs.readFileSync(sourceMapPath, 'utf-8'),
    );
    const events = await changeNamesToSourceMaps(
      sourceMap,
      chromeEvents,
      bundleFileName,
    );
    return events;
  }
  return chromeEvents;
};
