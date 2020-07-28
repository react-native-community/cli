/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview
 *
 * This model converts the `Profile` and `ProfileChunk` mega trace events from the `disabled-by-default-v8.cpu_profiler`
 * category into B/E-style trace events that main-thread-tasks.js already knows how to parse into a task tree.
 *
 * The CPU profiler measures where time is being spent by sampling the stack (See https://www.jetbrains.com/help/profiler/Profiling_Guidelines__Choosing_the_Right_Profiling_Mode.html
 * for a generic description of the differences between tracing and sampling).
 *
 * A `Profile` event is a record of the stack that was being executed at different sample points in time.
 * It has a structure like this:
 *
 *    nodes: [function A, function B, function C]
 *    samples: [node with id 2, node with id 1, ...]
 *    timeDeltas: [4125μs since last sample, 121μs since last sample, ...]
 *
 * Helpful prior art:
 * @see https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/sdk/CPUProfileDataModel.js?sq=package:chromium&g=0&l=42
 * @see https://github.com/v8/v8/blob/99ca333b0efba3236954b823101315aefeac51ab/tools/profile.js
 * @see https://github.com/jlfwong/speedscope/blob/9ed1eb192cb7e9dac43a5f25bd101af169dc654a/src/import/chrome.ts#L200
 */

import axios, { AxiosResponse } from 'axios';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

import {
  DurationEvent,
  HermesCPUProfile,
  HermesSample,
  HermesStackFrame,
  CPUProfileChunk,
  CPUProfileChunkNode,
  CPUProfileChunker,
  SourceMap,
} from './EventInterfaces';
import { EventsPhase } from './Phases';

export class CpuProfilerModel {
  _profile: CPUProfileChunk;
  _nodesById: Map<number, CPUProfileChunkNode>;
  _activeNodeArraysById: Map<number, number[]>;

  constructor(profile: CPUProfileChunk) {
    this._profile = profile;
    this._nodesById = this._createNodeMap();
    this._activeNodeArraysById = this._createActiveNodeArrays();
  }

  /**
   * Initialization function to enable O(1) access to nodes by node ID.
   * @return {Map<number, CPUProfileChunkNode}
   */
  _createNodeMap(): Map<number, CPUProfileChunkNode> {
    /** @type {Map<number, CpuProfile['nodes'][0]>} */
    const map: Map<number, CPUProfileChunkNode> = new Map<
      number,
      CPUProfileChunkNode
    >();
    for (const node of this._profile.nodes) {
      map.set(node.id, node);
    }

    return map;
  }

  /**
   * Initialization function to enable O(1) access to the set of active nodes in the stack by node ID.
   * @return Map<number, number[]>
   */
  _createActiveNodeArrays(): Map<number, number[]> {
    const map: Map<number, number[]> = new Map<number, number[]>();

    /**
     * Given a nodeId, `getActiveNodes` gets all the parent nodes in reversed call order
     * @param {number} id
     */
    const getActiveNodes = (id: number): number[] => {
      if (map.has(id)) return map.get(id) || [];

      const node = this._nodesById.get(id);
      if (!node) throw new Error(`No such node ${id}`);
      if (node.parent) {
        const array = getActiveNodes(node.parent).concat([id]);
        map.set(id, array);
        return array;
      } else {
        return [id];
      }
    };

    for (const node of this._profile.nodes) {
      map.set(node.id, getActiveNodes(node.id));
    }
    return map;
  }

  /**
   * Returns all the node IDs in a stack when a specific nodeId is at the top of the stack
   * (i.e. a stack's node ID and the node ID of all of its parents).
   */
  _getActiveNodeIds(nodeId: number): number[] {
    const activeNodeIds = this._activeNodeArraysById.get(nodeId);
    if (!activeNodeIds) throw new Error(`No such node ID ${nodeId}`);
    return activeNodeIds;
  }

  /**
   * Generates the necessary B/E-style trace events for a single transition from stack A to stack B
   * at the given timestamp.
   *
   * Example:
   *
   *    timestamp 1234
   *    previousNodeIds 1,2,3
   *    currentNodeIds 1,2,4
   *
   *    yields [end 3 at ts 1234, begin 4 at ts 1234]
   *
   * @param {number} timestamp
   * @param {Array<number>} previousNodeIds
   * @param {Array<number>} currentNodeIds
   * @returns {Array<DurationEvent>}
   */
  _createStartEndEventsForTransition(
    timestamp: number,
    previousNodeIds: number[],
    currentNodeIds: number[]
  ): DurationEvent[] {
    // Start nodes are the nodes which are present only in the currentNodeIds and not in PreviousNodeIds
    const startNodes: CPUProfileChunkNode[] = currentNodeIds
      .filter(id => !previousNodeIds.includes(id))
      .map(id => this._nodesById.get(id)!);
    // End nodes are the nodes which are present only in the PreviousNodeIds and not in CurrentNodeIds
    const endNodes: CPUProfileChunkNode[] = previousNodeIds
      .filter(id => !currentNodeIds.includes(id))
      .map(id => this._nodesById.get(id)!);

    /**
     * Create a Duration Event from CPUProfileChunkNodes.
     * @param {CPUProfileChunkNode} node
     * @return {DurationEvent} */
    const createEvent = (node: CPUProfileChunkNode): DurationEvent => ({
      ts: timestamp,
      pid: this._profile.pid,
      tid: Number(this._profile.tid),
      ph: EventsPhase.DURATION_EVENTS_BEGIN,
      name: node.callFrame.name,
      cat: node.callFrame.category,
      args: { data: { callFrame: node.callFrame } },
    });

    const startEvents: DurationEvent[] = startNodes
      .map(createEvent)
      .map(evt => ({ ...evt, ph: EventsPhase.DURATION_EVENTS_BEGIN }));
    const endEvents: DurationEvent[] = endNodes
      .map(createEvent)
      .map(evt => ({ ...evt, ph: EventsPhase.DURATION_EVENTS_END }));
    return [...endEvents.reverse(), ...startEvents];
  }

  /**
   * Creates B/E-style trace events from a CpuProfile object created by `collectProfileEvents()`
   * @return {DurationEvent}
   */
  createStartEndEvents(): DurationEvent[] {
    const profile = this._profile;
    const length = profile.samples.length;
    if (profile.timeDeltas.length !== length)
      throw new Error(`Invalid CPU profile length`);

    const events: DurationEvent[] = [];

    let timestamp = profile.startTime;
    let lastActiveNodeIds: number[] = [];
    for (let i = 0; i < profile.samples.length; i++) {
      const nodeId = profile.samples[i];
      const timeDelta = Math.max(profile.timeDeltas[i], 1);
      const node = this._nodesById.get(nodeId);
      if (!node) throw new Error(`Missing node ${nodeId}`);

      timestamp += timeDelta;
      const activeNodeIds = this._getActiveNodeIds(nodeId);
      events.push(
        ...this._createStartEndEventsForTransition(
          timestamp,
          lastActiveNodeIds,
          activeNodeIds
        )
      );
      lastActiveNodeIds = activeNodeIds;
    }

    events.push(
      ...this._createStartEndEventsForTransition(
        timestamp,
        lastActiveNodeIds,
        []
      )
    );

    return events;
  }

  /**
   * Creates B/E-style trace events from a CpuProfile object created by `collectProfileEvents()`
   * @param {CPUProfileChunk} profile
   */
  static createStartEndEvents(profile: CPUProfileChunk) {
    const model = new CpuProfilerModel(profile);
    return model.createStartEndEvents();
  }

  /**
   * Converts the Hermes Sample into a single CpuProfileChunk object for consumption
   * by `createStartEndEvents()`.
   *
   * @param {HermesCPUProfile} profile
   * @throws Profile must have atleast one sample
   * @return {Array<CpuProfile>}
   */
  static collectProfileEvents(profile: HermesCPUProfile): CPUProfileChunk {
    if (profile.samples.length >= 0) {
      const { samples, stackFrames } = profile;
      // Assumption: The sample will have a single process
      const pid: number = samples[0].pid;
      // Assumption: Javascript is single threaded, so there should only be one thread throughout
      const tid: string = samples[0].tid;
      // TODO: What role does id play in string parsing
      const id: string = '0x1';
      const startTime: number = Number(samples[0].ts);
      const { nodes, sampleNumbers, timeDeltas } = this.constructNodes(
        samples,
        stackFrames
      );
      return {
        id,
        pid,
        tid,
        startTime,
        nodes,
        samples: sampleNumbers,
        timeDeltas,
      };
    } else {
      throw new Error('The hermes profile has zero samples');
    }
  }

  /**
   * Constructs CPUProfileChunk Nodes and the resultant samples and time deltas to be inputted into the
   * CPUProfileChunk object which will be processed to give createStartEndEvents()
   *
   * @param {HermesSample} samples
   * @param {Map<string, HermesStackFrame>} stackFrames
   * @return { Array<CPUProfileChunkNode>, Array<number>, Array<number> }
   */
  static constructNodes(
    samples: HermesSample[],
    stackFrames: { [key in string]: HermesStackFrame }
  ): CPUProfileChunker {
    samples = samples.map((sample: HermesSample) => {
      sample.stackFrameData = stackFrames[sample.sf];
      return sample;
    });
    const stackFrameIds: string[] = Object.keys(stackFrames);
    // TODO: What should URLs be? Change name to get things from SourceMaps

    const profileNodes: CPUProfileChunkNode[] = stackFrameIds.map(
      (stackFrameId: string) => {
        return {
          id: Number(stackFrameId),
          callFrame: {
            line: stackFrames[stackFrameId].line,
            column: stackFrames[stackFrameId].column,
            funcLine: stackFrames[stackFrameId].funcLine,
            funcColumn: stackFrames[stackFrameId].funcColumn,
            name: stackFrames[stackFrameId].name,
            category: stackFrames[stackFrameId].category,
            url: 'TODO',
          },
          parent: stackFrames[stackFrameId].parent,
        };
      }
    );
    const returnedSamples: number[] = [];
    const timeDeltas: number[] = [];
    let lastTimeStamp = Number(samples[0].ts);
    samples.forEach((sample: HermesSample, idx: number) => {
      returnedSamples.push(sample.sf);
      if (idx === 0) {
        timeDeltas.push(0);
      } else {
        const timeDiff = Number(sample.ts) - lastTimeStamp;
        lastTimeStamp = Number(sample.ts);
        timeDeltas.push(timeDiff);
      }
    });

    return {
      nodes: profileNodes,
      sampleNumbers: returnedSamples,
      timeDeltas,
    };
  }

  /**
   * Refer to the source maps for the `index.bundle` file. Throws error if debug server not running
   * @param {string} metroServerURL
   * @param {DurationEvent[]} chromeEvents
   * @throws {Debug Server not running}
   * @returns {DurationEvent[]}
   */
  static async changeNamesToSourceMaps(
    metroServerURL: string,
    chromeEvents: DurationEvent[]
  ): Promise<DurationEvent[]> {
    /**
     * To eliminate Metro Server depedency, sourceMap needs to be the input of this function NOT
     * metroServerURL
     */
    const response = (await axios.get(metroServerURL)) as AxiosResponse<
      SourceMap
    >;
    if (!response.data) {
      throw new Error('Incorrect Debug Port Provided');
    }
    const sourceMap: SourceMap = response.data;
    const rawSourceMap: RawSourceMap = {
      version: Number(sourceMap.version),
      file: 'index.bundle',
      sources: sourceMap.sources,
      mappings: sourceMap.mappings,
      names: sourceMap.names,
    };

    const consumer = await new SourceMapConsumer(rawSourceMap);
    const events = chromeEvents.map((event: DurationEvent) => {
      const sm = consumer.originalPositionFor({
        line: Number(event.args?.data.callFrame.line),
        column: Number(event.args?.data.callFrame.column),
      });
      event.args = {
        data: {
          callFrame: {
            ...event.args?.data.callFrame,
            url: sm.source,
            line: sm.line,
            column: sm.column,
          },
        },
      };
      /**
       * The name in source maps (for reasons I don't understand) is sometimes null, so OR-ing this
       * to ensure a name is assigned.
       * In case a name wasn't found, the URL is used
       * Eg: /Users/saphal/Desktop/app/node_modules/react-native/Libraries/BatchedBridge/MessageQueue.js => MessageQueue.js
       */
      event.name =
        sm.name ||
        (event.args?.data.callFrame.url
          ? event.args?.data.callFrame.url.split('/').pop()
          : event.args?.data.callFrame.name);
      return event;
    });
    consumer.destroy();
    return events;
  }
}