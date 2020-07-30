import {EventsPhase} from './Phases';

export interface SharedEventProperties {
  /**
   * name of the event
   */
  name?: string;
  /**
   * event category
   */
  cat?: string;
  /**
   * tracing clock timestamp
   */
  ts?: number;
  /**
   * process ID
   */
  pid?: number;
  /**
   * thread ID
   */
  tid?: number;
  /**
   * event type (phase)
   */
  ph: EventsPhase;
  /**
   * id for a stackFrame object
   */
  sf?: number;
  /**
   * thread clock timestamp
   */
  tts?: number;
  /**
   * a fixed color name
   */
  cname?: string;
  /**
   * event arguments
   */
  args?: {[key in string]: any};
}

interface DurationEventBegin extends SharedEventProperties {
  ph: EventsPhase.DURATION_EVENTS_BEGIN;
}

interface DurationEventEnd extends SharedEventProperties {
  ph: EventsPhase.DURATION_EVENTS_END;
}

export type DurationEvent = DurationEventBegin | DurationEventEnd;

export type Event = DurationEvent;

/**
 * Each item in the stackFrames object of the hermes profile
 */
export interface HermesStackFrame {
  line: string;
  column: string;
  funcLine: string;
  funcColumn: string;
  name: string;
  category: string;
  /**
   * A parent function may or may not exist
   */
  parent?: number;
}
/**
 * Each item in the samples array of the hermes profile
 */
export interface HermesSample {
  cpu: string;
  name: string;
  ts: string;
  pid: number;
  tid: string;
  weight: string;
  /**
   * Will refer to an element in the stackFrames object of the Hermes Profile
   */
  sf: number;
  stackFrameData?: HermesStackFrame;
}

/**
 * Hermes Profile Interface
 */
export interface HermesCPUProfile {
  traceEvents: SharedEventProperties[];
  samples: HermesSample[];
  stackFrames: {[key in string]: HermesStackFrame};
}

export interface CPUProfileChunk {
  id: string;
  pid: number;
  tid: string;
  startTime: number;
  nodes: CPUProfileChunkNode[];
  samples: number[];
  timeDeltas: number[];
}

export interface CPUProfileChunkNode {
  id: number;
  callFrame: {
    line: string;
    column: string;
    funcLine: string;
    funcColumn: string;
    name: string;
    url?: string;
    category: string;
  };
  parent?: number;
}

export type CPUProfileChunker = {
  nodes: CPUProfileChunkNode[];
  sampleNumbers: number[];
  timeDeltas: number[];
};

export interface SourceMap {
  version: string;
  sources: string[];
  sourceContent: string[];
  x_facebook_sources: {names: string[]; mappings: string}[] | null;
  names: string[];
  mappings: string;
}
